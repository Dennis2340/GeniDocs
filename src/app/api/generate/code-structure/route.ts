import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { processRepository } from '../../../../../scripts/acorn-parser';
import { generateAIDocumentation } from '../../../../utils/aiDocGenerator';
import { prisma } from '@/utils/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';

// In-memory store for documentation generation progress logs and progress tracking
// This is a simple solution that doesn't require database schema changes
export const documentationLogs: Record<string, string[]> = {};
export const documentationProgress: Record<string, number> = {};
export const documentationSteps: Record<string, string> = {};

/**
 * Add a log entry with timestamp to the in-memory log store
 * Also updates progress and step tracking
 * @param documentationId The ID of the documentation being generated
 * @param message The log message to add
 * @param progress Optional progress percentage (0-100)
 * @param step Optional current step name
 */
function addLogEntry(
  documentationId: string,
  message: string,
  progress?: number,
  step?: string
) {
  if (!documentationLogs[documentationId]) {
    documentationLogs[documentationId] = [];
  }
  
  // Add timestamp to log message
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] ${message}`;
  documentationLogs[documentationId].push(logEntry);
  
  // Update progress if provided
  if (typeof progress === 'number') {
    documentationProgress[documentationId] = progress;
  }
  
  // Update current step if provided
  if (step) {
    documentationSteps[documentationId] = step;
  }
  
  // Log to console for debugging
  console.log(`[Doc ${documentationId}] ${message}`);
}

interface RepoRequest {
  repoId: string;
}

export async function POST(req: NextRequest) {
  try {
    console.log('Starting code structure documentation generation...');
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Validate request body
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { repoId } = body as RepoRequest;

    if (!repoId) {
      return NextResponse.json(
        { error: 'Repository ID is required' },
        { status: 400 }
      );
    }

    // Get repository details from the database
    const repository = await prisma.repository.findUnique({
      where: { id: repoId },
    });

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }
    
    // Make sure we have a user ID
    if (!session.user.email) {
      return NextResponse.json(
        { error: 'User email not found in session' },
        { status: 400 }
      );
    }
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get the user's GitHub access token
    const userAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: 'github'
      }
    });
    
    if (!userAccount || !userAccount.access_token) {
      return NextResponse.json(
        { error: 'GitHub access token not found. Please reconnect your GitHub account.' },
        { status: 400 }
      );
    }

    // Check if documentation already exists for this repository
    let documentation = await prisma.documentation.findUnique({
      where: { repositoryId: repoId }
    });
    
    if (documentation) {
      // Update existing documentation record
      documentation = await prisma.documentation.update({
        where: { id: documentation.id },
        data: { status: 'INITIALIZING' }
      });
      console.log(`Updated existing documentation record: ${documentation.id}`);
    } else {
      // Create a new documentation record
      documentation = await prisma.documentation.create({
        data: {
          repositoryId: repoId,
          status: 'INITIALIZING',
        },
      });
      console.log(`Created new documentation record: ${documentation.id}`);
    }

    // Start the documentation generation process asynchronously
    generateDocumentation(repository, documentation.id, userAccount.access_token).catch(error => {
      console.error('Error in async documentation generation:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Documentation generation started',
      documentationId: documentation.id,
    });
  } catch (error: any) {
    console.error('Error in POST handler:', error);
    
    let errorMessage = 'An unexpected error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Log detailed error information
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: typeof error
    });
    
    // Try to update documentation status to FAILED if possible
    try {
      // Clone the request to read the body again
      const clonedReq = req.clone();
      const body = await clonedReq.json().catch(e => {
        console.error('Failed to parse request body for error handling:', e);
        return {};
      });
      
      const { repoId } = body as Partial<RepoRequest>;
      
      if (repoId) {
        console.log(`Updating documentation status to FAILED for repository ${repoId}`);
        await prisma.documentation.updateMany({
          where: { repositoryId: repoId },
          data: {
            status: 'FAILED',
          },
        });
      } else {
        console.error('No repository ID found in request body for error handling');
      }
    } catch (updateError) {
      console.error('Error updating documentation status:', updateError);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process repository', 
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

async function generateDocumentation(repository: any, documentationId: string, githubToken: string) {
  // Validate inputs
  if (!repository) {
    console.error('Repository object is required');
    throw new Error('Repository object is required');
  }
  
  if (!documentationId) {
    console.error('Documentation ID is required');
    throw new Error('Documentation ID is required');
  }
  
  // Initialize logs and progress tracking
  documentationLogs[documentationId] = [];
  documentationProgress[documentationId] = 0;
  documentationSteps[documentationId] = 'initializing';
  
  try {
    // Update status to ANALYZING
    await prisma.documentation.update({
      where: { id: documentationId },
      data: {
        status: 'ANALYZING',
      }
    });
    
    addLogEntry(documentationId, 'Starting documentation generation with Tree-sitter', 5, 'initializing');
    addLogEntry(documentationId, 'Validating repository information', 10, 'initializing');

    // Validate GitHub token
    if (!githubToken) {
      addLogEntry(documentationId, 'ERROR: GitHub token is missing', 0, 'failed');
      throw new Error('GitHub token is not available');
    }

    // Initialize Octokit with user's GitHub token and better configuration
    const octokit = new Octokit({
      auth: githubToken,
      request: {
        timeout: 60000, // 60 second timeout
      },
    });

    // Extract owner and name from repository fullName
    if (!repository.fullName) {
      addLogEntry(documentationId, 'ERROR: Repository full name is missing', 0, 'failed');
      throw new Error('Repository full name is required');
    }
    
    const [owner, name] = repository.fullName.split('/');
    
    if (!owner || !name) {
      addLogEntry(documentationId, 'ERROR: Invalid repository name format', 0, 'failed');
      throw new Error('Invalid repository full name format. Expected format: owner/name');
    }

    // Process repository to extract code structure
    const repo = { owner, name };
    
    addLogEntry(documentationId, `Analyzing repository: ${repo.owner}/${repo.name}`, 15, 'analyzing');
    addLogEntry(documentationId, 'Testing GitHub API access...', 18, 'analyzing');
    
    try {
      // Test API access before proceeding
      await octokit.repos.get({
        owner: repo.owner,
        repo: repo.name,
      });
      addLogEntry(documentationId, 'GitHub API access confirmed', 20, 'analyzing');
    } catch (apiError: any) {
      const errorMsg = `GitHub API access failed: ${apiError.message}`;
      addLogEntry(documentationId, `ERROR: ${errorMsg}`, 0, 'failed');
      
      if (apiError.status === 404) {
        throw new Error(`Repository ${repo.owner}/${repo.name} not found or not accessible`);
      } else if (apiError.status === 401 || apiError.status === 403) {
        throw new Error('GitHub authentication failed or insufficient permissions');
      } else {
        throw new Error(errorMsg);
      }
    }
    
    addLogEntry(documentationId, 'Extracting code structure with Tree-sitter parser', 25, 'analyzing');
    
    const codeStructure = await processRepository(repo, octokit);
    
    if (!codeStructure || Object.keys(codeStructure).length === 0) {
      addLogEntry(documentationId, 'ERROR: Failed to extract code structure', 0, 'failed');
      throw new Error('Failed to extract code structure - no parseable files found');
    }

    // Update status to GENERATING
    await prisma.documentation.update({
      where: { id: documentationId },
      data: {
        status: 'GENERATING',
      }
    });

    addLogEntry(documentationId, 'Code structure extracted successfully', 40, 'generating');
    addLogEntry(documentationId, `Found ${Object.keys(codeStructure).length} feature groups`, 45, 'generating');
    
    // Log feature groups for debugging
    const featureGroups = Object.keys(codeStructure);
    addLogEntry(documentationId, `Feature groups: ${featureGroups.join(', ')}`, 47, 'generating');
    
    addLogEntry(documentationId, 'Generating documentation with AI...', 50, 'generating');
    
    // Generate documentation using AI
    const documentation = await generateAIDocumentation(codeStructure as Record<string, any[]>, repository.name);
    
    if (!documentation || !documentation.urls) {
      addLogEntry(documentationId, 'ERROR: Failed to generate documentation', 0, 'failed');
      throw new Error('Failed to generate documentation - AI generation returned no results');
    }

    // Update status to FINALIZING
    await prisma.documentation.update({
      where: { id: documentationId },
      data: {
        status: 'FINALIZING',
      }
    });

    addLogEntry(documentationId, 'Documentation generated successfully', 75, 'finalizing');
    addLogEntry(documentationId, 'Saving documentation to database', 85, 'finalizing');
    
    // Save documentation URLs to the database
    await prisma.documentation.update({
      where: { id: documentationId },
      data: {
        status: 'COMPLETED',
        generatedUrl: documentation.urls?.overview || '',
      }
    });

    addLogEntry(documentationId, 'Documentation process completed successfully!', 100, 'completed');
  } catch (error: unknown) {
    console.error('Error generating documentation:', error);
    
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    addLogEntry(documentationId, `ERROR: ${errorMessage}`, 0, 'failed');
    
    // Update documentation status to FAILED
    try {
      await prisma.documentation.update({
        where: { id: documentationId },
        data: {
          status: 'FAILED',
        }
      });
    } catch (updateError) {
      console.error('Failed to update documentation status to FAILED:', updateError);
    }
    
    // Re-throw the error so it can be handled upstream if needed
    throw error;
  }
}

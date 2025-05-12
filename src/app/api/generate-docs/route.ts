import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { generateAndUploadDoc, generateRepoMetadata } from "@/utils/aiDocGenerator";
import { prisma } from "@/utils/db";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { repositoryId, files } = await req.json();

    if (!repositoryId || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "Repository ID and files array are required" },
        { status: 400 }
      );
    }

    // Get repository information from database
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
      include: { documentation: true }
    });

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    // Update documentation status to GENERATING
    await prisma.documentation.upsert({
      where: { repositoryId },
      update: { status: "GENERATING", updatedAt: new Date() },
      create: {
        repositoryId,
        status: "GENERATING"
      }
    });

    // Process each file and generate documentation
    const processedFiles = [];
    
    for (const file of files) {
      const { filename, content } = file;
      
      // Skip files that don't need documentation or are too large
      if (!shouldProcessFile(filename, content)) {
        continue;
      }
      
      try {
        // Generate and upload documentation for this file
        const result = await generateAndUploadDoc({
          filename,
          content,
          repoName: repository.name
        });
        
        processedFiles.push({
          filename,
          docPath: result.path,
          url: result.url
        });
      } catch (error) {
        console.error(`Error processing file ${filename}:`, error);
        // Continue with other files even if one fails
      }
    }

    // Generate metadata file with links to all docs
    let metadataUrl = null;
    if (processedFiles.length > 0) {
      metadataUrl = await generateRepoMetadata(repository.name, processedFiles);
    }

    // Update documentation status to COMPLETED
    await prisma.documentation.update({
      where: { repositoryId },
      data: {
        status: "COMPLETED",
        generatedUrl: metadataUrl,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      filesProcessed: processedFiles.length,
      metadataUrl
    });
  } catch (error) {
    console.error("Error generating documentation:", error);
    
    // Update documentation status to FAILED if there was an error
    try {
      const { repositoryId } = await req.json();
      if (repositoryId) {
        await prisma.documentation.update({
          where: { repositoryId },
          data: {
            status: "FAILED",
            updatedAt: new Date()
          }
        });
      }
    } catch (e) {
      // Ignore errors in error handling
    }
    
    return NextResponse.json(
      { error: "Failed to generate documentation" },
      { status: 500 }
    );
  }
}

/**
 * Determines if a file should be processed for documentation
 * @param filename The name of the file
 * @param content The content of the file
 * @returns boolean Whether the file should be processed
 */
function shouldProcessFile(filename: string, content: string): boolean {
  // Skip files that are too large (over 100KB)
  if (content.length > 100000) {
    return false;
  }
  
  // Skip binary files, images, etc.
  const skipExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2',
    '.ttf', '.eot', '.mp3', '.mp4', '.webm', '.pdf', '.zip', '.tar',
    '.gz', '.lock'
  ];
  
  if (skipExtensions.some(ext => filename.toLowerCase().endsWith(ext))) {
    return false;
  }
  
  // Skip files that are already documentation
  if (filename.toLowerCase().includes('readme') || 
      filename.toLowerCase().includes('license') ||
      filename.toLowerCase().endsWith('.md')) {
    return false;
  }
  
  return true;
}

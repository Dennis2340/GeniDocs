import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// Import the in-memory stores from the code-structure route
import { documentationLogs, documentationProgress, documentationSteps } from '../code-structure/route';

// Define the response type for better type safety
type StatusResponse = {
  status: string;
  url?: string | null;
  repository: string;
  user: string;
  repo: string;
  logs: string[];
  progress: number;
  currentStep: string;
  docusaurusUrl: string | null;
  lastUpdate: string;
  estimatedTimeRemaining?: string;
  error?: string;
}

/**
 * GET handler for documentation status endpoint
 * Provides real-time progress updates, logs, and status information
 */
export async function GET(request: NextRequest) {
  try {
    // Get documentationId from query parameters
    const documentationId = request.nextUrl.searchParams.get("documentationId");

    // If documentationId is missing or undefined, return a more helpful error
    if (!documentationId || documentationId === "undefined") {
      return NextResponse.json(
        {
          error: "Documentation ID is required",
          message: "Please provide a valid documentationId parameter",
          status: "ERROR",
        },
        { status: 400 }
      );
    }

    // Find the documentation in the database
    const documentation = await prisma.documentation.findUnique({
      where: { id: documentationId },
      include: {
        repository: true,
      },
    });

    if (!documentation) {
      return NextResponse.json(
        {
          error: "Documentation not found",
          message: "The requested documentation does not exist",
          status: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Get user session for authentication if needed in the future
    // const session = await getServerSession(authOptions);

    // Extract owner and repo from repository fullName
    const parts = documentation.repository.fullName.split("/");
    const owner = parts[0] || "unknown";
    const repo = parts[1] || "unknown";

    // Get logs for this documentation process if available
    const repoId = documentation.repository.id;
    const logs = documentationLogs[repoId] || [`Documentation status: ${documentation.status}`];
    
    // Get progress and current step information
    const progress = documentationProgress[repoId] || 0;
    const currentStep = documentationSteps[repoId] || 'initializing';
    
    // Calculate estimated time remaining based on progress
    let estimatedTimeRemaining: string | undefined;
    if (progress > 0 && progress < 100) {
      // Simple calculation - assumes 5 minutes total for 100%
      const remainingPercentage = 100 - progress;
      const remainingMinutes = Math.ceil((remainingPercentage / 100) * 5);
      estimatedTimeRemaining = `${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    }
    
    // Prepare the response
    const response: StatusResponse = {
      status: documentation.status,
      url: documentation.generatedUrl,
      repository: documentation.repository.fullName,
      user: owner,
      repo: repo,
      logs: logs.slice(-50), // Return only the last 50 logs to avoid large responses
      progress: progress,
      currentStep: currentStep,
      docusaurusUrl: documentation.generatedUrl || null,
      lastUpdate: new Date().toISOString()
    };
    
    // Add estimated time if available
    if (estimatedTimeRemaining) {
      response.estimatedTimeRemaining = estimatedTimeRemaining;
    }
    
    // Return the documentation status with logs, progress, and step information
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error checking documentation status:", error);
    return NextResponse.json(
      { 
        error: error.message || "Unknown error",
        status: "ERROR",
        logs: [`Error: ${error.message || "Unknown error"}`],
        progress: 0,
        currentStep: "error",
        lastUpdate: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/utils/db";
import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";
import {
  generateIndexPage,
  generateFallbackIndex,
  analyzeFileForDocumentation,
  generateFileDocumentation,
} from "@/utils/ai";
import { addFrontMatter } from "@/utils/markdown";
import { ensureDocusaurusConfig } from "@/utils/docusaurus-config";
import { sanitizeFrontMatterValue } from "@/utils/sanitize";
import { createSidebar } from "@/utils/sidebar-utils";
// Default unauthenticated Octokit instance for fallback
const octokit = new Octokit();

// Set the directory where documentation will be stored
const DOCS_DIR = path.join(process.cwd(), "docs", "docs");

// In-memory store for documentation generation progress logs and progress tracking
// This is a simple solution that doesn't require database schema changes
export const documentationLogs: Record<string, string[]> = {};
export const documentationProgress: Record<string, number> = {};
export const documentationSteps: Record<string, string> = {};

// Import the generateSidebar function from a dedicated utility file
import { generateSidebar } from "@/utils/sidebar-generator";
import { autoDeploy } from "@/utils/auto-deploy";

/**
 * Add a log entry with timestamp to the in-memory log store
 * Also updates progress and step tracking
 */
function addLogEntry(
  repoId: string,
  message: string,
  progress?: number,
  step?: string
) {
  if (!documentationLogs[repoId]) {
    documentationLogs[repoId] = [];
    documentationProgress[repoId] = 0;
    documentationSteps[repoId] = "initializing";
  }

  // Add timestamp to the log message
  const timestamp = new Date().toLocaleTimeString();
  const logWithTimestamp = `[${timestamp}] ${message}`;

  documentationLogs[repoId].push(logWithTimestamp);

  // Update progress if provided
  if (progress !== undefined) {
    documentationProgress[repoId] = progress;
  }

  // Update current step if provided
  if (step) {
    documentationSteps[repoId] = step;
  }

  // Also log to server console
  console.log(
    `[${repoId}] ${logWithTimestamp} (Progress: ${documentationProgress[repoId]}%, Step: ${documentationSteps[repoId]})`
  );
}

/**
 * Initialize the repository documentation process
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    const user = await prisma.user.findUnique({
      where: {
        id: session?.user?.id,
      },
      include: {
        accounts: {
          select: {
            access_token: true,
          },
        },
      },
    });

    if (!user?.accounts[0].access_token) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let githubToken = user.accounts[0].access_token;
    let owner: string | undefined;
    let repo: string | undefined;

    // Check if the request has a repoId parameter (from dashboard)
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get("repoId");

    if (repoId) {
      // If repoId is provided, fetch repository from the database
      const repository = await prisma.repository.findUnique({
        where: { id: repoId },
      });

      if (!repository) {
        return NextResponse.json(
          { error: "Repository not found" },
          { status: 404 }
        );
      }

      // Extract owner and repo from fullName
      [owner, repo] = repository.fullName.split("/");
    } else {
      // Otherwise, try to parse form data for direct submissions
      try {
        const contentType = request.headers.get("content-type") || "";

        // Only try to parse form data if the content type is appropriate
        if (
          contentType.includes("multipart/form-data") ||
          contentType.includes("application/x-www-form-urlencoded")
        ) {
          const formData = await request.formData();
          owner = formData.get("owner")?.toString();
          repo = formData.get("repo")?.toString();
        } else {
          // Try to parse JSON body as fallback
          const jsonData = await request.json().catch(() => ({}));
          owner = jsonData.owner;
          repo = jsonData.repo;
        }
      } catch (error) {
        console.error("Error parsing request data:", error);
        return NextResponse.json(
          { error: "Invalid request format" },
          { status: 400 }
        );
      }
    }

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Repository owner and name are required" },
        { status: 400 }
      );
    }

    // Create authenticated Octokit instance if a token is available
    const githubClient = githubToken
      ? new Octokit({ auth: githubToken })
      : octokit;

    // Verify repository access
    try {
      await githubClient.repos.get({
        owner,
        repo,
      });
    } catch (error: any) {
      // If we can't access the repository, return an error
      if (error.status === 404) {
        return NextResponse.json(
          { error: "Repository not found or you don't have access to it" },
          { status: 404 }
        );
      }

      if (error.status === 401 || error.status === 403) {
        return NextResponse.json(
          {
            error:
              "Unauthorized to access this repository. Please provide a valid GitHub token.",
          },
          { status: 401 }
        );
      }
    }

    // Check if the repository exists in the database first
    let repository;

    if (repoId) {
      // If we already fetched the repository by ID earlier
      repository = await prisma.repository.findUnique({
        where: { id: repoId },
      });
    } else {
      // Otherwise, look up by fullName
      repository = await prisma.repository.findFirst({
        where: {
          fullName: `${owner}/${repo}`,
        },
      });

      // If it doesn't exist, create it
      if (!repository) {
        try {
          // First, ensure we have a valid organization to link the repository to
          let organization;

          if (session?.user?.id) {
            // Try to find user's organization
            organization = await prisma.organization.findFirst({
              where: {
                users: {
                  some: {
                    id: session.user.id,
                  },
                },
              },
            });
          }

          // If no organization found, create a default one
          if (!organization) {
            // Check if default organization exists
            organization = await prisma.organization.findFirst({
              where: {
                slug: "default-organization",
              },
            });

            // Create default organization if it doesn't exist
            if (!organization) {
              organization = await prisma.organization.create({
                data: {
                  name: "Default Organization",
                  slug: "default-organization",
                },
              });
            }
          }

          // Now create the repository with the valid organization ID
          repository = await prisma.repository.create({
            data: {
              name: repo,
              fullName: `${owner}/${repo}`,
              githubId: `${owner}-${repo}`,
              githubUrl: `https://github.com/${owner}/${repo}`,
              description: `Repository for ${owner}/${repo}`,
              organizationId: organization.id, // This is now guaranteed to be valid
            },
          });
        } catch (error: any) {
          console.error("Error creating repository:", error);
          throw new Error(`Failed to create repository: ${error.message}`);
        }
      }
    }

    // After the repository is looked up or created, add a null check
    if (!repository) {
      return NextResponse.json(
        { error: "Failed to find or create repository" },
        { status: 500 }
      );
    }



  } catch (error) {
    console.error("Error in documentation generation:", error);
    return NextResponse.json(
      { error: "Failed to generate documentation" },
      { status: 500 }
    );
  }
}



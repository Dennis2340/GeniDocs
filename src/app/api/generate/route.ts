import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import {
  generateFileDocumentation,
  generateIndexPage,
  shouldDocumentFile,
} from "@/utils/ai";
import path from "path";
import fs from "fs";
import { sanitizeFrontMatterValue } from "@/utils/sanitize";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();
// Default unauthenticated Octokit instance for fallback
const octokit = new Octokit();

// Set the directory where documentation will be stored
const DOCS_DIR = path.join(process.cwd(), "docs", "docs");

/**
 * Initialize the repository documentation process
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    let githubToken = null;
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
          const formToken = formData.get("token")?.toString();
          githubToken = formToken || null;
        } else {
          // Try to parse JSON body as fallback
          const jsonData = await request.json().catch(() => ({}));
          owner = jsonData.owner;
          repo = jsonData.repo;
          githubToken = jsonData.token || null;
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
        // Create a default organization ID
        let organizationId = "default-org-id";

        if (session?.user?.id) {
          // Get or create user's organization
          const userOrg = await prisma.organization.findFirst({
            where: {
              users: {
                some: {
                  id: session.user.id,
                },
              },
            },
          });

          if (userOrg) {
            organizationId = userOrg.id;
          }
        }

        repository = await prisma.repository.create({
          data: {
            name: repo,
            fullName: `${owner}/${repo}`,
            githubId: `${owner}-${repo}`,
            githubUrl: `https://github.com/${owner}/${repo}`,
            description: `Repository for ${owner}/${repo}`,
            organizationId,
          },
        });
      }
    }

    // After the repository is looked up or created, add a null check
    if (!repository) {
      return NextResponse.json(
        { error: "Failed to find or create repository" },
        { status: 500 }
      );
    }

    // Create docs subfolders if they don't exist
    ensureDirectoriesExist();

    // Now repository is guaranteed to be non-null
    const repoSlug = getRepoSlug(repository.fullName);
    const repoDir = path.join(DOCS_DIR, repoSlug);

    if (!fs.existsSync(repoDir)) {
      fs.mkdirSync(repoDir, { recursive: true });
    }

    // Log the beginning of documentation generation
    console.log(`Starting documentation generation for ${repository.fullName}`);

    // Create or update documentation record in database
    const documentation = await prisma.documentation.upsert({
      where: {
        repositoryId: repository.id,
      },
      update: {
        status: "GENERATING",
        updatedAt: new Date(),
      },
      create: {
        repositoryId: repository.id,
        status: "GENERATING",
      },
    });

    // Update repository status in database
    await prisma.repository.update({
      where: { id: repository.id },
      data: {
        updatedAt: new Date(),
      },
    });

    // Start the background processing
    generateDocumentation(repository, githubToken)
      .then(async () => {
        // Update status when complete
        await prisma.documentation.update({
          where: { id: documentation.id },
          data: {
            status: "COMPLETED",
            updatedAt: new Date(),
            generatedUrl: `/docs/${repoSlug}`,
          },
        });

        await prisma.repository.update({
          where: { id: repository.id },
          data: {
            updatedAt: new Date(),
          },
        });

        console.log(
          `Documentation generation completed for ${repository.fullName}`
        );
      })
      .catch(async (error) => {
        // Update status when failed
        await prisma.documentation.update({
          where: { id: documentation.id },
          data: {
            status: "FAILED",
            updatedAt: new Date(),
          },
        });

        await prisma.repository.update({
          where: { id: repository.id },
          data: {
            updatedAt: new Date(),
          },
        });

        console.error(
          `Documentation generation failed for ${repository.fullName}:`,
          error
        );
      });

    // Create the intro file immediately
    await createIntroFile(repository);

    // Return success response with documentationId
    return NextResponse.json({
      message: "Documentation generation started",
      repoId: repository.id,
      repository: {
        fullName: repository.fullName,
        name: repository.name,
      },
      status: "GENERATING",
      documentationId: documentation.id,
      docsUrl: `/docs/${repoSlug}`,
    });
  } catch (error) {
    console.error("Error in documentation generation:", error);
    return NextResponse.json(
      { error: "Failed to generate documentation" },
      { status: 500 }
    );
  }
}

/**
 * Create the intro file for a repository
 */
async function createIntroFile(repository: any) {
  try {
    const repoSlug = getRepoSlug(repository.fullName);
    const repoDir = path.join(DOCS_DIR, repoSlug);

    // Ensure the repository directory exists
    if (!fs.existsSync(repoDir)) {
      fs.mkdirSync(repoDir, { recursive: true });
    }

    // Create intro file with repository information
    const [owner, repo] = repository.fullName.split("/");

    const introContent = `---
id: "intro"
title: "${sanitizeFrontMatterValue(repository.name)} Documentation"
sidebar_position: 1
slug: "/docs/${repoSlug}"
---

# ${repository.name} Documentation

This documentation is automatically generated from the codebase using AI analysis.

## Repository Information

- **Owner**: ${owner}
- **Repository**: ${repo}
- **URL**: https://github.com/${repository.fullName}

## Getting Started

Browse the documentation using the sidebar navigation to explore different parts of the codebase.
`;

    // Write the intro file
    fs.writeFileSync(path.join(repoDir, "intro.md"), introContent);
    console.log(`Created intro file for ${repository.fullName}`);
  } catch (error) {
    console.error(
      `Error creating intro file for ${repository.fullName}:`,
      error
    );
  }
}

/**
 * Generate documentation for a repository
 */
async function generateDocumentation(repository: any, token: string | null) {
  try {
    // Extract owner and repo names from the fullName
    const [owner, repo] = repository.fullName.split("/");
    const repoSlug = getRepoSlug(repository.fullName);
    const repoDir = path.join(DOCS_DIR, repoSlug);

    // Create authenticated Octokit instance if token is provided
    const githubClient = token ? new Octokit({ auth: token }) : octokit;

    // Fetch repository content
    const result = await githubClient.repos.getContent({
      owner,
      repo,
      path: "",
    });

    // Process only if content is an array (directory listing)
    if (Array.isArray(result.data)) {
      const documentedFiles: string[] = [];
      const contentItems = result.data;

      // Process all files and directories recursively
      await processRepoContent(
        owner,
        repo,
        "",
        contentItems,
        repoDir,
        documentedFiles,
        githubClient
      );

      // Generate index page in repository directory
      if (documentedFiles.length > 0) {
        const indexContent = await generateIndexPage(
          repository.name,
          documentedFiles
        );
        if (indexContent) {
          fs.writeFileSync(
            path.join(repoDir, "overview.md"),
            addFrontMatter(indexContent, "overview", "Overview", 2)
          );
        }
      }
    }
  } catch (error) {
    console.error(
      `Error generating documentation for ${repository.fullName}:`,
      error
    );
    throw error;
  }
}

/**
 * Process repository content recursively
 */
async function processRepoContent(
  owner: string,
  repo: string,
  path: string,
  contentItems: any[],
  repoDir: string,
  documentedFiles: string[],
  githubClient?: Octokit
) {
  // Use provided GitHub client or default to unauthenticated client
  const client = githubClient || octokit;

  // Create directories for structure in repository subdirectory
  for (const item of contentItems) {
    if (item.type === "dir") {
      // Skip common directories that don't need documentation
      const skipDirs = [
        "node_modules",
        ".git",
        "dist",
        "build",
        "out",
        "public",
        ".next",
      ];
      if (skipDirs.includes(item.name)) {
        continue;
      }

      const subdirPath = path ? `${path}/${item.name}` : item.name;

      // Create corresponding directory in docs
      const docsSubdir = `${repoDir}/${item.name}`;

      if (!fs.existsSync(docsSubdir)) {
        fs.mkdirSync(docsSubdir, { recursive: true });
      }

      // Fetch subdirectory content
      try {
        const subDirContent = await client.repos.getContent({
          owner,
          repo,
          path: subdirPath,
        });

        if (Array.isArray(subDirContent.data)) {
          // Process subdirectory content recursively
          await processRepoContent(
            owner,
            repo,
            subdirPath,
            subDirContent.data,
            repoDir,
            documentedFiles,
            client
          );
        }
      } catch (error) {
        console.error(
          `Error fetching subdirectory content for ${subdirPath}:`,
          error
        );
      }
    } else if (item.type === "file" && shouldDocumentFile(item.name)) {
      // Process individual file
      try {
        const filePath = path ? `${path}/${item.name}` : item.name;

        // Get file content
        const fileContent = await client.repos.getContent({
          owner,
          repo,
          path: filePath,
        });

        // If file content is available
        if (fileContent.data && "content" in fileContent.data) {
          // Decode Base64 content
          const content = Buffer.from(
            fileContent.data.content,
            "base64"
          ).toString();

          // Generate documentation for the file
          const documentation = await generateFileDocumentation(
            item.name,
            content
          );

          // Create directory structure if needed
          const dirPathInDocs = repoDir;

          if (!fs.existsSync(dirPathInDocs)) {
            fs.mkdirSync(dirPathInDocs, { recursive: true });
          }

          // Sanitize the filename for the docs
          const docFilename = item.name
            .replace(/\.[^/.]+$/, "")
            .replace(/\s+/g, "-")
            .toLowerCase();
          const docPath = path
            ? `${path}/${docFilename}.md`
            : `${docFilename}.md`;

          // Determine sidebar position based on importance
          const isMainFile = ["index", "main", "app", "server"].some((name) =>
            item.name.toLowerCase().includes(name)
          );
          const position = isMainFile ? 2 : 10;

          // Add front matter to the documentation
          const docWithFrontMatter = addFrontMatter(
            documentation,
            docFilename,
            `${item.name}`,
            position
          );

          // Write the documentation file
          fs.writeFileSync(
            `${dirPathInDocs}/${docFilename}.md`,
            docWithFrontMatter
          );

          // Add to the list of documented files
          documentedFiles.push(docPath);
          console.log(`Generated documentation for ${filePath}`);
        }
      } catch (error) {
        console.error(`Error processing file ${item.name}:`, error);
      }
    }
  }
}

/**
 * Add Docusaurus front matter to markdown content
 */
function addFrontMatter(
  content: string,
  id: string,
  title: string,
  position: number
): string {
  // If content already has front matter, don't add it again
  if (content.startsWith("---")) {
    return content;
  }

  // Sanitize front matter values to prevent YAML parsing issues
  const sanitizedTitle = sanitizeFrontMatterValue(title);
  const sanitizedId = id.replace(/[^\w-]/g, "-").toLowerCase();

  return `---
id: "${sanitizedId}"
title: "${sanitizedTitle}"
sidebar_position: ${position}
---

${content}`;
}

/**
 * Get all markdown files in a directory recursively
 */
function getAllFiles(dir: string, baseDir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively scan subdirectories
      results = results.concat(getAllFiles(filePath, baseDir));
    } else if (file.endsWith(".md")) {
      // Convert absolute path to relative path from baseDir
      const relativePath = filePath.slice(
        path.join(DOCS_DIR, baseDir).length + 1
      );

      // Format for Docusaurus sidebar (prefix with repo directory)
      const sidebarPath = `${baseDir}/${relativePath.replace(/\\/g, "/")}`;
      results.push(sidebarPath);
    }
  }

  return results;
}

/**
 * Get a slug from the repository full name
 */
function getRepoSlug(fullName: string): string {
  // Replace slashes and non-alphanumeric characters with dashes
  return fullName
    .replace(/\//g, "-")
    .replace(/[^\w-]/g, "-")
    .toLowerCase();
}

/**
 * Ensure all necessary directories exist
 */
function ensureDirectoriesExist() {
  // Main documentation directory
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }
}

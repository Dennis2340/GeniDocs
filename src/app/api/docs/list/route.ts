import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface Repository {
  owner: string;
  repo: string;
}

/**
 * API endpoint to list repositories with documentation
 */
export async function GET(request: NextRequest) {
  try {
    // Get all repositories from the docs directory
    const docsDir = path.join(process.cwd(), "docs", "docs");

    if (!fs.existsSync(docsDir)) {
      return NextResponse.json({
        success: true,
        repositories: [],
      });
    }

    const repositories: Repository[] = [];

    // Get all owner directories
    const owners = fs.readdirSync(docsDir).filter((item) => {
      const itemPath = path.join(docsDir, item);
      return fs.statSync(itemPath).isDirectory();
    });

    // Get repositories for each owner
    owners.forEach((owner) => {
      const ownerDir = path.join(docsDir, owner);

      const repos = fs.readdirSync(ownerDir).filter((item) => {
        const itemPath = path.join(ownerDir, item);
        return fs.statSync(itemPath).isDirectory();
      });

      repos.forEach((repo) => {
        repositories.push({ owner, repo });
      });
    });

    return NextResponse.json({
      success: true,
      repositories,
    });
  } catch (error: any) {
    console.error("Error listing repositories:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to list repositories",
      },
      { status: 500 }
    );
  }
}

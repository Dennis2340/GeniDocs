import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/auth";
import fs from "fs";
import path from "path";

/**
 * API endpoint to get the configuration for a repository's documentation
 * This helps the client know where to find documentation files
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session to check if the user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the repository slug from the query parameters
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Repository slug is required" },
        { status: 400 }
      );
    }

    // Check if the documentation directory exists
    const docsDir = path.join(process.cwd(), "docs", "docs");
    const repoDir = path.join(docsDir, slug);
    
    // Check if the directory exists
    const directoryExists = fs.existsSync(repoDir) && fs.statSync(repoDir).isDirectory();
    
    // Check if the index file exists
    const indexPath = path.join(repoDir, "index.md");
    const indexExists = fs.existsSync(indexPath);
    
    // Get a list of all documentation files for this repository
    let files: string[] = [];
    if (directoryExists) {
      files = getAllFiles(repoDir).map(file => {
        // Convert absolute paths to relative paths
        return file.replace(repoDir + path.sep, '');
      });
    }

    return NextResponse.json({
      slug,
      directoryExists,
      indexExists,
      files,
      basePath: `/docs/${slug}`,
      apiPath: `/api/docs/content?slug=${slug}`,
      fallbackPath: `/api/docs/fallback?slug=${slug}`
    });
  } catch (error) {
    console.error("Error getting documentation config:", error);
    return NextResponse.json(
      { error: "Failed to get documentation configuration" },
      { status: 500 }
    );
  }
}

/**
 * Get all files in a directory recursively
 * @param dir Directory to search
 * @returns Array of file paths
 */
function getAllFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files: string[] = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        // Recursively get files from subdirectories
        files.push(...getAllFiles(itemPath));
      } else if (stats.isFile() && item.endsWith('.md')) {
        // Only include markdown files
        files.push(itemPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

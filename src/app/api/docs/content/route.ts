import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/auth";
import fs from "fs";
import path from "path";

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

    // Get the repository slug and file from the query parameters
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const file = searchParams.get("file") || "index.md";

    if (!slug) {
      return NextResponse.json(
        { error: "Repository slug is required" },
        { status: 400 }
      );
    }

    // Construct the path to the documentation file
    const docsDir = path.join(process.cwd(), "docs", "docs");
    const repoDir = path.join(docsDir, slug);
    
    // Normalize file path to handle various formats
    const normalizedFile = file.replace(/\\/g, '/'); // Convert Windows backslashes to forward slashes
    
    // Determine the file path
    let filePath = "";
    if (normalizedFile.endsWith(".md")) {
      filePath = path.join(repoDir, normalizedFile);
    } else {
      filePath = path.join(repoDir, `${normalizedFile}.md`);
    }
    
    // Handle paths with directories
    if (normalizedFile.includes('/')) {
      const dirPath = normalizedFile.substring(0, normalizedFile.lastIndexOf('/'));
      const fileName = normalizedFile.substring(normalizedFile.lastIndexOf('/') + 1);
      const dirFullPath = path.join(repoDir, dirPath);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(dirFullPath)) {
        try {
          fs.mkdirSync(dirFullPath, { recursive: true });
        } catch (err) {
          console.error(`Error creating directory ${dirFullPath}:`, err);
        }
      }
    }

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      // Try to find the file in subdirectories
      const allFiles = getAllFiles(repoDir);
      const matchingFile = allFiles.find(f => 
        path.basename(f) === file || 
        path.basename(f) === `${file}.md`
      );

      if (matchingFile) {
        filePath = matchingFile;
      } else {
        return NextResponse.json(
          { error: "Documentation file not found" },
          { status: 404 }
        );
      }
    }

    // Read the file content
    const content = fs.readFileSync(filePath, "utf8");

    // Return the file content
    return NextResponse.json({
      slug,
      file: path.basename(filePath),
      path: path.relative(repoDir, filePath),
      content,
    });
  } catch (error: any) {
    console.error("Error fetching documentation content:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
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
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...getAllFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/auth";
import fs from "fs";
import path from "path";

/**
 * Fallback API endpoint to directly access documentation files from the file system
 * This is used when the content endpoint fails to retrieve the file
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

    // Normalize file path to handle various formats
    const normalizedFile = file.replace(/\\/g, '/'); // Convert Windows backslashes to forward slashes
    
    // Handle paths with directories
    let dirPath = '';
    let fileName = normalizedFile;
    
    if (normalizedFile.includes('/')) {
      dirPath = normalizedFile.substring(0, normalizedFile.lastIndexOf('/'));
      fileName = normalizedFile.substring(normalizedFile.lastIndexOf('/') + 1);
    }
    
    // Try multiple possible locations for the documentation file
    const possiblePaths = [
      // Standard location in the docs/docs directory
      path.join(process.cwd(), "docs", "docs", slug, normalizedFile),
      
      // Try with .md extension if not provided
      path.join(process.cwd(), "docs", "docs", slug, `${normalizedFile}.md`),
      
      // If file has directories, try with and without extension
      ...(dirPath ? [
        path.join(process.cwd(), "docs", "docs", slug, dirPath, fileName),
        path.join(process.cwd(), "docs", "docs", slug, dirPath, `${fileName}.md`)
      ] : []),
      
      // Try in the root of the docs directory
      path.join(process.cwd(), "docs", "docs", normalizedFile),
      path.join(process.cwd(), "docs", "docs", `${normalizedFile}.md`),
      
      // Try with the slug as a subdirectory of the file name
      path.join(process.cwd(), "docs", "docs", `${slug}-${normalizedFile}`),
      
      // Try with the slug as a prefix in the file name
      path.join(process.cwd(), "docs", "docs", `${slug}-${normalizedFile}.md`),
    ];

    // Try to find the file in any of the possible locations
    let content = null;
    let foundPath = null;

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        content = fs.readFileSync(possiblePath, "utf8");
        foundPath = possiblePath;
        break;
      }
    }

    // If file not found in any of the standard locations, search recursively
    if (!content) {
      const docsDir = path.join(process.cwd(), "docs", "docs");
      if (fs.existsSync(docsDir)) {
        // Search for files matching the name in all subdirectories
        const allFiles = getAllFiles(docsDir);
        const fileName = file.endsWith(".md") ? file : `${file}.md`;
        
        // Find files that match the name or contain the slug
        const matchingFiles = allFiles.filter(f => 
          path.basename(f) === fileName || 
          path.basename(f).includes(slug)
        );
        
        if (matchingFiles.length > 0) {
          // Use the first matching file
          content = fs.readFileSync(matchingFiles[0], "utf8");
          foundPath = matchingFiles[0];
        }
      }
    }

    if (!content) {
      // If still not found, create a default content
      return NextResponse.json(
        { 
          error: "Documentation file not found",
          content: `# ${slug} Documentation\n\nWelcome to the documentation for ${slug.replace(/-/g, "/")}.\n\nThis documentation was generated using GeniDocs, an AI-powered documentation generator.`
        },
        { status: 404 }
      );
    }

    // Return the file content
    return NextResponse.json({
      slug,
      file: path.basename(foundPath!),
      path: foundPath!,
      content,
    });
  } catch (error: any) {
    console.error("Error fetching fallback documentation content:", error);
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

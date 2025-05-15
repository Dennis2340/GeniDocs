import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/utils/db";
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

    // Get the repository slug from the query parameters
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Repository slug is required" },
        { status: 400 }
      );
    }

    // Construct the path to the documentation directory
    const docsDir = path.join(process.cwd(), "docs", "docs");
    const repoDir = path.join(docsDir, slug);

    // Check if the directory exists
    if (!fs.existsSync(repoDir)) {
      return NextResponse.json(
        { error: "Documentation not found for this repository" },
        { status: 404 }
      );
    }

    // Try to load the sidebar.js file if it exists
    const sidebarJsPath = path.join(repoDir, "sidebar.js");
    const sidebarJsonPath = path.join(repoDir, "sidebar.json");
    
    let sidebarItems = [];
    
    if (fs.existsSync(sidebarJsPath)) {
      try {
        // We can't directly require the file here, so we'll read it and parse it
        const sidebarContent = fs.readFileSync(sidebarJsPath, "utf8");
        // Extract the JSON part from module.exports = {...}
        const jsonMatch = sidebarContent.match(/module\.exports\s*=\s*(\{[\s\S]*\})/);
        if (jsonMatch && jsonMatch[1]) {
          const jsonStr = jsonMatch[1].replace(/'/g, '"');
          sidebarItems = JSON.parse(jsonStr);
        }
      } catch (error) {
        console.error("Error parsing sidebar.js:", error);
      }
    } else if (fs.existsSync(sidebarJsonPath)) {
      try {
        const sidebarContent = fs.readFileSync(sidebarJsonPath, "utf8");
        sidebarItems = JSON.parse(sidebarContent);
      } catch (error) {
        console.error("Error parsing sidebar.json:", error);
      }
    }

    // If no sidebar file exists or parsing failed, generate one from the directory structure
    if (!sidebarItems.length) {
      sidebarItems = generateSidebarFromFiles(repoDir, slug);
    }

    // Return the sidebar items
    return NextResponse.json({
      slug,
      items: sidebarItems,
    });
  } catch (error: any) {
    console.error("Error fetching sidebar:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

/**
 * Generate sidebar items from the directory structure
 * @param dir Directory to scan
 * @param slug Repository slug
 * @returns Array of sidebar items
 */
function generateSidebarFromFiles(dir: string, slug: string): any[] {
  const items: any[] = [];
  
  // Add index.md as the first item if it exists
  const indexPath = path.join(dir, "index.md");
  if (fs.existsSync(indexPath)) {
    items.push({
      label: "Overview",
      file: "index.md",
    });
  }
  
  // Get all markdown files except index.md
  const files = getMarkdownFiles(dir);
  
  // Sort files by name
  files.sort((a, b) => {
    // Put README.md at the top if index.md doesn't exist
    if (path.basename(a) === "README.md") return -1;
    if (path.basename(b) === "README.md") return 1;
    return path.basename(a).localeCompare(path.basename(b));
  });
  
  // Add files to sidebar
  for (const file of files) {
    if (path.basename(file) === "index.md") continue;
    
    const relativePath = path.relative(dir, file);
    const label = getFileLabel(file);
    
    items.push({
      label,
      file: relativePath,
    });
  }
  
  // Get all directories
  const directories = getDirectories(dir);
  
  // Process each directory
  for (const directory of directories) {
    const dirName = path.basename(directory);
    const dirItems = generateSidebarFromFiles(directory, `${slug}/${dirName}`);
    
    if (dirItems.length > 0) {
      items.push({
        label: formatLabel(dirName),
        items: dirItems,
        directory: path.relative(dir, directory),
      });
    }
  }
  
  return items;
}

/**
 * Get all markdown files in a directory (non-recursive)
 * @param dir Directory to scan
 * @returns Array of file paths
 */
function getMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  
  try {
    return fs.readdirSync(dir)
      .filter(file => file.endsWith(".md"))
      .map(file => path.join(dir, file));
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }
}

/**
 * Get all directories in a directory (non-recursive)
 * @param dir Directory to scan
 * @returns Array of directory paths
 */
function getDirectories(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => path.join(dir, dirent.name));
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }
}

/**
 * Get a human-readable label from a file path
 * @param filePath File path
 * @returns Human-readable label
 */
function getFileLabel(filePath: string): string {
  const fileName = path.basename(filePath, ".md");
  
  // Try to extract title from frontmatter
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const titleMatch = content.match(/title:\s*["'](.+?)["']/);
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1];
    }
  } catch (error) {
    // Ignore errors
  }
  
  return formatLabel(fileName);
}

/**
 * Format a string as a human-readable label
 * @param str String to format
 * @returns Formatted label
 */
function formatLabel(str: string): string {
  return str
    .replace(/-/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

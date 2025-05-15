import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/utils/db";
import fs from "fs";
import path from "path";

interface DocumentedRepository {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  slug: string;
  status: string;
  updatedAt: string;
}

/**
 * API endpoint to list repositories with documentation
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session to check if the user is authenticated
    // Make sure to pass authOptions to getServerSession
    const session = await getServerSession(authOptions);
    
    // Log session info for debugging
    console.log('Session in /api/docs/list:', { 
      hasSession: !!session,
      hasUser: !!session?.user,
      email: session?.user?.email 
    });
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be signed in to access this resource" },
        { status: 401 }
      );
    }

    // Find the user and their repositories
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: {
          include: {
            repositories: {
              include: {
                documentation: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.organization) {
      return NextResponse.json({
        success: true,
        repositories: [],
      });
    }

    // Get all repositories from the docs directory
    const docsDir = path.join(process.cwd(), "docs", "docs");
    const docsExist = fs.existsSync(docsDir);
    
    // Get all repository directories in the docs folder
    const docsFolders = docsExist ? 
      fs.readdirSync(docsDir).filter(item => {
        const itemPath = path.join(docsDir, item);
        return fs.statSync(itemPath).isDirectory();
      }) : [];

    // Map repositories to include documentation status
    const repositories: DocumentedRepository[] = user.organization.repositories.map(repo => {
      // Create a slug from the repository name
      const owner = repo.fullName.split('/')[0];
      const slug = `${owner}-${repo.name}`.toLowerCase();
      
      // Check if documentation exists in the filesystem
      const hasDocsFolder = docsFolders.includes(slug);
      
      // Determine documentation status
      let status = "NONE";
      if (repo.documentation) {
        status = repo.documentation.status;
      } else if (hasDocsFolder) {
        status = "COMPLETED"; // Docs exist but no DB record
      }
      
      return {
        id: repo.id,
        name: repo.name,
        fullName: repo.fullName,
        description: repo.description || undefined,
        slug,
        status,
        updatedAt: repo.documentation?.updatedAt.toISOString() || repo.updatedAt.toISOString(),
      };
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

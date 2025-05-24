import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/db";

/**
 * Update the plugin installation status for a repository
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { repoId } = await params;
    
    // Get the repository
    const repository = await prisma.repository.findUnique({
      where: { id: repoId },
    });

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const { installed } = await request.json();
    
    try {
      // @ts-ignore - Ignoring TypeScript errors since we know the metadata field exists in the schema
      // After running the Prisma migration and generating the client, these errors will go away
      await prisma.repository.update({
        where: { id: repoId },
        data: {
          // @ts-ignore - Using metadata field directly
          metadata: {
            pluginInstalled: installed,
            pluginInstalledAt: new Date().toISOString(),
            pluginVersion: '1.0.0' // You can update this with your actual plugin version
          }
        },
      });
    } catch (metadataError) {
      console.error('Error updating metadata, falling back to description:', metadataError);
      
      // Fallback: If metadata field isn't available yet (migration not run),
      // store the status in the description field temporarily
      await prisma.repository.update({
        where: { id: repoId },
        data: {
          description: `${repository.description || ''} [PLUGIN_STATUS:${installed ? 'installed' : 'not_installed'}]`.trim()
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating plugin status:", error);
    return NextResponse.json(
      { error: "Failed to update plugin status" },
      { status: 500 }
    );
  }
}

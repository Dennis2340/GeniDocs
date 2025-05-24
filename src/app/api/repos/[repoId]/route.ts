import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Not logged in" },
        { status: 401 }
      );
    }

    // Ensure params is properly accessed
    const { repoId } = await params;

    if (!repoId) {
      return NextResponse.json(
        { error: "Repository ID is required" },
        { status: 400 }
      );
    }

    // Find the repository in the database
    const repository = await prisma.repository.findUnique({
      where: { id: repoId },
    });

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    // Return the repository data
    return NextResponse.json({
      id: repository.id,
      name: repository.name,
      fullName: repository.fullName,
      description: repository.description,
      githubUrl: repository.githubUrl,
      lastIndexedAt: repository.lastIndexedAt,
    });
  } catch (error) {
    console.error("Error fetching repository:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository" },
      { status: 500 }
    );
  }
}

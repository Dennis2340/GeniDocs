import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    // Get documentationId from query parameters
    const documentationId = request.nextUrl.searchParams.get("documentationId");

    // If documentationId is missing or undefined, return a more helpful error
    if (!documentationId || documentationId === "undefined") {
      return NextResponse.json(
        {
          error: "Documentation ID is required",
          message: "Please provide a valid documentationId parameter",
          status: "ERROR",
        },
        { status: 400 }
      );
    }

    // Find the documentation in the database
    const documentation = await prisma.documentation.findUnique({
      where: { id: documentationId },
      include: {
        repository: true,
      },
    });

    if (!documentation) {
      return NextResponse.json(
        {
          error: "Documentation not found",
          message: "The requested documentation does not exist",
          status: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Get user session for authentication if needed in the future
    // const session = await getServerSession(authOptions);

    // Extract owner and repo from repository fullName
    const parts = documentation.repository.fullName.split("/");
    const owner = parts[0];
    const repo = parts[1];

    // Return the documentation status
    return NextResponse.json({
      status: documentation.status,
      url: documentation.generatedUrl,
      repository: documentation.repository.fullName,
      user: owner,
      repo: repo,
    });
  } catch (error: any) {
    console.error("Error checking documentation status:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { generateAndUploadDoc } from "@/utils/aiDocGenerator";

/**
 * Simple API endpoint for testing the documentation generation flow
 * This endpoint bypasses authentication and database operations
 * It can be used with Postman to test the AI documentation generation
 */
export async function POST(req: NextRequest) {
  try {
    // Get file data from request
    const { filename, content, repoName = "test-repo" } = await req.json();

    // Validate required fields
    if (!filename || !content) {
      return NextResponse.json(
        { error: "Filename and content are required" },
        { status: 400 }
      );
    }

    console.log(`Processing file: ${filename}`);

    // Generate and upload documentation
    const result = await generateAndUploadDoc({
      filename,
      content,
      repoName
    });

    // Return the result
    return NextResponse.json({
      success: true,
      filename,
      path: result.path,
      url: result.url
    });
  } catch (error: any) {
    console.error("Error generating documentation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate documentation" },
      { status: 500 }
    );
  }
}

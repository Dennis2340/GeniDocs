import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    console.log("Running documentation standardization scripts...");

    // Run the standardization scripts
    const result = await execAsync("npm run docs:standard");

    console.log("Standardization scripts output:", result.stdout);

    if (result.stderr) {
      console.error("Standardization scripts errors:", result.stderr);
    }

    return NextResponse.json({
      success: true,
      message: "Documentation standardization completed successfully",
    });
  } catch (error: any) {
    console.error("Error running standardization scripts:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        stderr: error.stderr || null,
      },
      { status: 500 }
    );
  }
}

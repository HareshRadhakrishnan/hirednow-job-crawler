import { NextRequest, NextResponse } from "next/server";
import { fetchSingleJobUrl } from "@/lib/crawler";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobUrl } = body;

    if (!jobUrl || typeof jobUrl !== "string") {
      return NextResponse.json(
        { error: "Job URL is required", blocked: false },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(jobUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format", blocked: false },
        { status: 400 }
      );
    }

    const result = await fetchSingleJobUrl(jobUrl.trim());

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error, 
          blocked: result.blocked,
          canManualPaste: true 
        },
        { status: result.blocked ? 403 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      job: result.job,
    });
  } catch (error) {
    console.error("Fetch job API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch job", 
        blocked: true,
        canManualPaste: true 
      },
      { status: 500 }
    );
  }
}

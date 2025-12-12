import { NextRequest, NextResponse } from "next/server";
import { crawlJobs } from "@/lib/crawler";
import { JobBoard } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobRole, jobBoard = "awign", location = "" } = body;

    if (!jobRole || typeof jobRole !== "string") {
      return NextResponse.json(
        { error: "Job role is required" },
        { status: 400 }
      );
    }

    // Validate job board
    const validBoards: JobBoard[] = ["awign", "indeed"];
    const board: JobBoard = validBoards.includes(jobBoard) ? jobBoard : "awign";

    const result = await crawlJobs(jobRole.trim(), board, location);

    if (result.error && result.jobs.length === 0) {
      return NextResponse.json(
        { error: result.error, jobs: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      jobs: result.jobs,
      warning: result.error,
    });
  } catch (error) {
    console.error("Crawl API error:", error);
    return NextResponse.json(
      { error: "Failed to crawl jobs", jobs: [] },
      { status: 500 }
    );
  }
}

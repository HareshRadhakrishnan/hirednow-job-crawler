import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ASSESSMENT_SYSTEM_PROMPT } from "@/lib/prompts";
import dotenv from "dotenv";

dotenv.config();
const anthropic = new Anthropic({
  apiKey: dotenv.config().parsed?.ANTHROPIC_API_KEY,
});

console.log("Anthropic API Key: "+process.env.ANTHROPIC_API_KEY); 

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobDescription, jobTitle } = body;

    if (!jobDescription || typeof jobDescription !== "string") {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    const userMessage = `Job Title: ${jobTitle || "Unknown"}

Job Description:
${jobDescription}

Please analyze this job and provide the assessment design.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: ASSESSMENT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === "text");
    const assessment = textContent ? textContent.text : "No assessment generated";

    return NextResponse.json({
      assessment,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error("Assessment API error:", error);
    
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Anthropic API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate assessment" },
      { status: 500 }
    );
  }
}


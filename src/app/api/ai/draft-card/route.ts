import { NextRequest, NextResponse } from "next/server";
import { draftCardFromPrompt } from "@/ai/flows/draft-card-from-prompt-flow";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }
    const result = await draftCardFromPrompt({ prompt: prompt.trim() });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI provider error";
    console.error("[ai/draft-card]", message);
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

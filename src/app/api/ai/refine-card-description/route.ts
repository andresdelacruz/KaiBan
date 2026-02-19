import { NextRequest, NextResponse } from "next/server";
import { refineCardDescription } from "@/ai/flows/refine-card-description-flow";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const description = body?.description;
    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json({ error: "description is required" }, { status: 400 });
    }
    const result = await refineCardDescription({ description: description.trim() });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI provider error";
    console.error("[ai/refine-card-description]", message);
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

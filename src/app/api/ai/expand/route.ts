import { NextResponse } from "next/server";
import { CLAUDE_MODEL, getClaude } from "@/lib/ai";
import type { Persona } from "@/lib/personas";
import { getPersona } from "@/lib/personas";

export const runtime = "nodejs";

interface ExpandRequest {
  title: string;
  description?: string;
  kind: string;
  persona?: Persona;
}

interface Child {
  title: string;
  description?: string;
}

/**
 * POST /api/ai/expand
 *
 * Given a node (title + description + kind), ask Claude to suggest
 * three concrete child ideas. Accepts an optional `persona` to change
 * the analytical lens (analyst, entrepreneur, engineer, creative, investor).
 */
export async function POST(req: Request) {
  let body: ExpandRequest;
  try {
    body = (await req.json()) as ExpandRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  const persona = getPersona(body.persona ?? "default");

  const systemPrompt = `${persona.systemPrompt}
You are operating as a mind-map assistant. When asked to expand a node, return ONLY valid JSON — no prose.`;

  const userPrompt = `The user has a node of kind "${body.kind}" with this content:

Title: ${body.title}
Description: ${body.description || "(none)"}

Suggest exactly 3 concrete, useful child ideas that meaningfully expand this node.
Think from your assigned perspective: ${persona.label}.
Each child should have a short title (max 6 words) and a one-sentence description.

Respond with ONLY a valid JSON object in this exact shape:
{
  "children": [
    { "title": "string", "description": "string" },
    { "title": "string", "description": "string" },
    { "title": "string", "description": "string" }
  ]
}`;

  try {
    const client = getClaude();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.type === "text" ? textBlock.text : "";

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON in response");

    const parsed = JSON.parse(raw.slice(start, end + 1)) as { children: Child[] };
    const children = (parsed.children ?? []).slice(0, 5).map((c) => ({
      title: String(c.title ?? "Untitled").slice(0, 60),
      description: c.description ? String(c.description).slice(0, 240) : "",
    }));

    return NextResponse.json({ children });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

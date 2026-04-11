import { NextResponse } from "next/server";
import { CLAUDE_MODEL, getClaude } from "@/lib/ai";
import type { Persona } from "@/lib/personas";
import { getPersona } from "@/lib/personas";

export const runtime = "nodejs";

interface GenerateRequest {
  instruction: string;
  parentTitle?: string;
  parentKind?: string;
  persona?: Persona;
}

interface Child {
  title: string;
  description?: string;
  kind?: string;
}

/**
 * POST /api/ai/generate
 *
 * Takes a free-form user instruction (e.g. "give me 5 tasks to launch a SaaS")
 * and optionally the parent node context, and returns a set of typed child nodes.
 * The user can control count and content direction via plain language.
 */
export async function POST(req: Request) {
  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.instruction?.trim()) {
    return NextResponse.json({ error: "Missing instruction" }, { status: 400 });
  }

  const persona = getPersona(body.persona ?? "default");

  const parentContext = body.parentTitle
    ? `\nParent node: "${body.parentTitle}" (kind: ${body.parentKind ?? "idea"})`
    : "";

  const prompt = `${persona.systemPrompt}
You are a mind-map assistant. The user has given you an instruction to generate nodes.${parentContext}
Think from your assigned perspective: ${persona.label}.

User instruction: "${body.instruction}"

Generate between 2 and 8 nodes that best satisfy the instruction.
For each node, pick the most appropriate kind from: idea, task, budget, place, event.
Use "idea" as the default when unsure.

Each node must have:
- title: max 8 words
- description: one sentence (max 200 chars)
- kind: one of idea | task | budget | place | event

Respond ONLY with valid JSON in exactly this shape, no prose:
{
  "nodes": [
    { "title": "string", "description": "string", "kind": "idea" },
    ...
  ]
}`;

  try {
    const client = getClaude();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock && textBlock.type === "text" ? textBlock.text : "";

    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON in response");

    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as {
      nodes: Child[];
    };

    const validKinds = new Set(["idea", "task", "budget", "place", "event"]);
    const nodes = (parsed.nodes ?? []).slice(0, 8).map((n) => ({
      title: String(n.title ?? "Untitled").slice(0, 80),
      description: n.description ? String(n.description).slice(0, 200) : "",
      kind: validKinds.has(n.kind ?? "") ? n.kind : "idea",
    }));

    return NextResponse.json({ nodes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

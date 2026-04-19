import { NextResponse } from "next/server";
import { CLAUDE_MODEL, getClaude } from "@/lib/ai";
import type { MindEdge, MindNode } from "@/lib/types";

export const runtime = "nodejs";

interface AnalyzeRequest {
  nodes: MindNode[];
  edges: MindEdge[];
  selectedId?: string;
}

export interface AnalysisResult {
  missing_nodes: string[];
  weak_areas: string[];
  contradictions: string[];
  suggestions: string[];
}

/**
 * POST /api/ai/analyze
 *
 * Sends the full graph to Claude for structured critique.
 * Returns a four-category analysis object.
 */
export async function POST(req: Request) {
  let body: AnalyzeRequest;
  try {
    body = (await req.json()) as AnalyzeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.nodes?.length) {
    return NextResponse.json({ error: "No nodes provided" }, { status: 400 });
  }

  // Serialize graph into a readable outline
  const nodeIndex = new Map(body.nodes.map((n) => [n.id, n]));
  const childrenOf = new Map<string, string[]>();
  for (const e of body.edges) {
    if (!childrenOf.has(e.source)) childrenOf.set(e.source, []);
    childrenOf.get(e.source)!.push(e.target);
  }

  function summarizeNode(n: MindNode, depth = 0): string {
    const indent = "  ".repeat(depth);
    const d = n.data;
    let line = `${indent}[${d.kind.toUpperCase()}] ${d.title}`;
    if ("description" in d && d.description) line += ` — ${d.description}`;
    if ("amount" in d && d.amount) line += ` ($${d.amount})`;
    if ("dueAt" in d && d.dueAt) line += ` (due ${d.dueAt})`;
    if ("location" in d && d.location) line += ` @ ${d.location}`;
    const kids = childrenOf.get(n.id) ?? [];
    const childLines = kids
      .map((id) => nodeIndex.get(id))
      .filter(Boolean)
      .map((child) => summarizeNode(child!, depth + 1));
    return [line, ...childLines].join("\n");
  }

  const roots = body.nodes.filter(
    (n) =>
      n.data.kind === "root" ||
      !body.edges.some((e) => e.target === n.id),
  );
  const graphText = roots.map((r) => summarizeNode(r)).join("\n\n");

  const focusLine = body.selectedId
    ? `\nThe user is currently focused on the node: "${nodeIndex.get(body.selectedId)?.data.title ?? body.selectedId}".`
    : "";

  const prompt = `You are a strategic planning assistant reviewing a mind map.${focusLine}

Here is the full graph:

${graphText}

Analyze this mind map and respond with ONLY a JSON object in exactly this shape:
{
  "missing_nodes": ["..."],
  "weak_areas": ["..."],
  "contradictions": ["..."],
  "suggestions": ["..."]
}

Rules:
- missing_nodes: categories or topics completely absent that would strengthen the plan (max 5 items)
- weak_areas: existing nodes/branches that are vague, incomplete, or thin (max 5 items)
- contradictions: logical conflicts, duplicated effort, or unrealistic combinations (max 4 items)
- suggestions: concrete, actionable next steps — always provide exactly 4 to 5 items, never fewer
- Each item is a short, plain-English sentence (max 15 words)
- If a category has nothing to report, return an empty array
- No prose outside the JSON`;

  try {
    const client = getClaude();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.type === "text" ? textBlock.text : "";

    if (response.stop_reason === "max_tokens") {
      throw new Error("Response was cut off. Try a smaller map.");
    }

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON in response");

    const parsed = JSON.parse(raw.slice(start, end + 1)) as AnalysisResult;

    const clean = (arr: unknown): string[] =>
      Array.isArray(arr)
        ? arr.map((s) => String(s).slice(0, 120)).slice(0, 6)
        : [];

    return NextResponse.json({
      missing_nodes: clean(parsed.missing_nodes),
      weak_areas: clean(parsed.weak_areas),
      contradictions: clean(parsed.contradictions),
      suggestions: clean(parsed.suggestions),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

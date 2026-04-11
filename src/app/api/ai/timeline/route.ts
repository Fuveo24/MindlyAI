import { NextResponse } from "next/server";
import { CLAUDE_MODEL, getClaude } from "@/lib/ai";
import type { MindNode } from "@/lib/types";

export const runtime = "nodejs";

interface TimelineRequest {
  nodes: MindNode[];
}

export interface TimelinePhase {
  label: string; // e.g. "Week 1", "Phase 2 — Research"
  items: string[];
  focus: string; // one-line description of what this phase achieves
}

export interface TimelineResult {
  title: string;
  phases: TimelinePhase[];
  summary: string;
}

/**
 * POST /api/ai/timeline
 *
 * Takes the current node list and asks Claude to produce a phased
 * execution roadmap. Returns structured phases the UI renders as a
 * horizontal timeline.
 */
export async function POST(req: Request) {
  let body: TimelineRequest;
  try {
    body = (await req.json()) as TimelineRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.nodes?.length) {
    return NextResponse.json({ error: "No nodes provided" }, { status: 400 });
  }

  const nodeList = body.nodes
    .map((n) => {
      const d = n.data;
      let line = `- [${d.kind.toUpperCase()}] ${d.title}`;
      if ("description" in d && d.description) line += `: ${d.description}`;
      if ("dueAt" in d && d.dueAt) line += ` (due ${d.dueAt})`;
      if ("amount" in d && d.amount) line += ` ($${d.amount})`;
      return line;
    })
    .join("\n");

  const prompt = `You are a project planning assistant. Below is a list of nodes from a mind map.
Convert this into a practical phased execution roadmap with 3–6 phases (e.g. "Week 1", "Week 2–3", "Month 2").

Nodes:
${nodeList}

Respond ONLY with valid JSON in exactly this shape, no prose:
{
  "title": "string — one-line project title",
  "summary": "string — 2-sentence project overview",
  "phases": [
    {
      "label": "string — e.g. 'Week 1' or 'Phase 1 — Foundation'",
      "focus": "string — one sentence on what this phase achieves",
      "items": ["string", "string", "string"]
    }
  ]
}

Rules:
- 3 to 6 phases total
- Each phase has 2–5 items
- Items are concrete action steps derived from the node list
- Labels use consistent time-boxing (weeks or phases, not both)
- No phase should be empty`;

  try {
    const client = getClaude();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1800,
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

    const parsed = JSON.parse(raw.slice(start, end + 1)) as TimelineResult;

    return NextResponse.json({
      title: String(parsed.title ?? "Project Roadmap").slice(0, 80),
      summary: String(parsed.summary ?? "").slice(0, 300),
      phases: (parsed.phases ?? []).slice(0, 8).map((p) => ({
        label: String(p.label ?? "Phase").slice(0, 60),
        focus: String(p.focus ?? "").slice(0, 160),
        items: (p.items ?? []).slice(0, 6).map((i) => String(i).slice(0, 120)),
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Timeline generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

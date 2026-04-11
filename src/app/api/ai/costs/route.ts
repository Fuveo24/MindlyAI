import { NextResponse } from "next/server";
import { CLAUDE_MODEL, getClaude } from "@/lib/ai";
import type { MindNode } from "@/lib/types";

export const runtime = "nodejs";

interface CostsRequest {
  nodes: MindNode[];
  domain?: string; // "startup" | "travel" | "app" | undefined
}

export interface CostItem {
  item: string;
  low: number;
  high: number;
  notes?: string;
}

export interface CostResult {
  currency: string;
  total_low: number;
  total_high: number;
  breakdown: CostItem[];
  hidden_costs: string[];
  assumptions: string[];
}

/**
 * POST /api/ai/costs
 *
 * Acts as a financial analyst: reads the node list and returns a
 * structured cost estimate with a range (low/high) and line items.
 */
export async function POST(req: Request) {
  let body: CostsRequest;
  try {
    body = (await req.json()) as CostsRequest;
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
      if ("amount" in d && d.amount) line += ` (stated cost: $${d.amount})`;
      return line;
    })
    .join("\n");

  const domainHint = body.domain
    ? `\nProject domain context: ${body.domain}`
    : "";

  const prompt = `You are a financial analyst reviewing a project mind map.${domainHint}

Nodes:
${nodeList}

Provide a cost estimate. Use approximate ranges (not exact) since information is incomplete.
Where a node states an explicit cost, use that as an anchor.
For everything else, give reasonable industry estimates.

Respond ONLY with valid JSON in exactly this shape, no prose:
{
  "currency": "USD",
  "total_low": number,
  "total_high": number,
  "breakdown": [
    { "item": "string", "low": number, "high": number, "notes": "string" }
  ],
  "hidden_costs": ["string"],
  "assumptions": ["string"]
}

Rules:
- breakdown: 3–8 line items, covering the main cost drivers from the node list
- Each item.low and item.high are monthly or one-time amounts in USD (integers)
- hidden_costs: 2–4 frequently overlooked costs (time, ops, compliance, etc.)
- assumptions: 2–3 key assumptions that affect the estimate
- total_low = sum of all item.low values
- total_high = sum of all item.high values`;

  try {
    const client = getClaude();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.type === "text" ? textBlock.text : "";

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON in response");

    const parsed = JSON.parse(raw.slice(start, end + 1)) as CostResult;

    return NextResponse.json({
      currency: String(parsed.currency ?? "USD"),
      total_low: Number(parsed.total_low ?? 0),
      total_high: Number(parsed.total_high ?? 0),
      breakdown: (parsed.breakdown ?? []).slice(0, 10).map((b) => ({
        item: String(b.item).slice(0, 80),
        low: Number(b.low ?? 0),
        high: Number(b.high ?? 0),
        notes: b.notes ? String(b.notes).slice(0, 160) : undefined,
      })),
      hidden_costs: (parsed.hidden_costs ?? [])
        .slice(0, 5)
        .map((s) => String(s).slice(0, 120)),
      assumptions: (parsed.assumptions ?? [])
        .slice(0, 4)
        .map((s) => String(s).slice(0, 120)),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cost estimation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

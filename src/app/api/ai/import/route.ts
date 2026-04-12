import { NextResponse } from "next/server";
import { CLAUDE_MODEL, getClaude } from "@/lib/ai";

export const runtime = "nodejs";

interface ImportRequest {
  text: string;
}

export interface ImportChild {
  kind: string;
  title: string;
  description: string;
}

export interface ImportBranch {
  kind: string;
  title: string;
  description: string;
  children: ImportChild[];
}

export interface ImportResult {
  title: string;
  branches: ImportBranch[];
}

/**
 * Splits text at sentence boundaries to avoid cutting words mid-sentence.
 */
function chunkText(text: string, size = 3000): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + size;

    if (end < text.length) {
      // Try to break at the last sentence boundary within the window
      const lastPeriod = text.lastIndexOf(".", end);
      if (lastPeriod > start + size * 0.5) end = lastPeriod + 1;
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) chunks.push(chunk);
    start = end;
  }

  return chunks;
}

/**
 * POST /api/ai/import
 *
 * Accepts a (potentially large) text block, chunks it if needed,
 * extracts key points per chunk in parallel, then synthesizes all
 * extracted points into a structured mind map tree.
 *
 * Returns { title, branches: [{ kind, title, description, children }] }
 */
export async function POST(req: Request) {
  let body: ImportRequest;
  try {
    body = (await req.json()) as ImportRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  if (text.length > 50000) {
    return NextResponse.json(
      { error: "Text too long (max 50,000 characters)" },
      { status: 400 },
    );
  }

  const client = getClaude();

  // For short texts send directly; for longer texts chunk → extract → synthesize
  let contentForSynthesis = text;

  if (text.length > 4000) {
    const chunks = chunkText(text, 3000);
    const chunksToProcess = chunks.slice(0, 5); // max 5 chunks

    // Extract key points from each chunk in parallel
    const extractions = await Promise.all(
      chunksToProcess.map(async (chunk, i) => {
        const res = await client.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content: `Extract the 5–8 most important topics, ideas, tasks, or facts from this passage. Be concise — bullet points only, no prose.\n\nPassage ${i + 1}:\n${chunk}`,
            },
          ],
        });
        const textBlock = res.content.find((b) => b.type === "text");
        return textBlock?.type === "text" ? textBlock.text : "";
      }),
    );

    contentForSynthesis = extractions.filter(Boolean).join("\n\n");
  }

  // Synthesis: turn the condensed content into a mind map tree
  const synthPrompt = `You are a mind map architect. Analyze this content and produce a structured mind map.

Content:
${contentForSynthesis}

Create a mind map with:
- A clear root title (the project / topic name)
- 3–6 main branches (high-level themes or categories)
- Each branch has 2–4 leaf nodes

Pick the best node kind for each item:
- "idea"   → concepts, themes, insights, general topics
- "task"   → actions, steps, to-dos, deliverables
- "budget" → costs, pricing, financial items
- "place"  → locations, venues, destinations
- "event"  → meetings, milestones, deadlines, dates

Respond ONLY with valid JSON in exactly this shape, no prose:
{
  "title": "string — root title, max 6 words",
  "branches": [
    {
      "kind": "idea",
      "title": "string — max 5 words",
      "description": "string — max 15 words",
      "children": [
        { "kind": "idea", "title": "string — max 5 words", "description": "string — max 15 words" }
      ]
    }
  ]
}

Rules:
- 3 to 6 branches total
- 2 to 4 children per branch
- Titles are concise noun phrases
- No branch or children array may be empty`;

  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2500,
      messages: [{ role: "user", content: synthPrompt }],
    });

    if (response.stop_reason === "max_tokens") {
      throw new Error("Response was cut off. Try shorter text.");
    }

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.type === "text" ? textBlock.text : "";

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON in response");

    const parsed = JSON.parse(raw.slice(start, end + 1)) as ImportResult;

    return NextResponse.json({
      title: String(parsed.title ?? "Imported Map").slice(0, 80),
      branches: (parsed.branches ?? []).slice(0, 8).map((b) => ({
        kind: b.kind ?? "idea",
        title: String(b.title ?? "").slice(0, 60),
        description: String(b.description ?? "").slice(0, 160),
        children: (b.children ?? []).slice(0, 6).map((c) => ({
          kind: c.kind ?? "idea",
          title: String(c.title ?? "").slice(0, 60),
          description: String(c.description ?? "").slice(0, 160),
        })),
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { CLAUDE_MODEL, getClaude } from "@/lib/ai";
import type { ImportResult } from "@/app/api/ai/import/route";

export const runtime = "nodejs";

interface ImageImportRequest {
  image: string; // base64-encoded image data (without data: prefix)
  mimeType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
}

const SYNTH_PROMPT = `Analyze this image — it may be a whiteboard, diagram, handwritten notes, screenshot, slide deck, or document.

Extract the key ideas, topics, tasks, and structure you can see, then produce a mind map.

Create:
- A clear root title (the main subject)
- 3–6 main branches (the high-level themes or sections you can identify)
- Each branch has 2–4 leaf nodes (specific details, subtopics, or action items)

Pick the best node kind for each item:
- "idea"   → concepts, themes, insights, general content
- "task"   → actions, steps, to-dos, deliverables
- "budget" → costs, prices, financial figures
- "place"  → locations, venues, destinations
- "event"  → meetings, milestones, dates

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
- If the image is unclear, extract whatever structure you can see`;

/**
 * POST /api/ai/import-image
 *
 * Accepts a base64-encoded image and asks Claude to extract a mind map
 * structure from it using the vision API.
 */
export async function POST(req: Request) {
  let body: ImageImportRequest;
  try {
    body = (await req.json()) as ImageImportRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.image) {
    return NextResponse.json({ error: "No image data provided" }, { status: 400 });
  }

  const validMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!validMimes.includes(body.mimeType)) {
    return NextResponse.json(
      { error: "Unsupported image type. Use JPEG, PNG, GIF, or WebP." },
      { status: 400 },
    );
  }

  // Rough size check: base64 is ~4/3 of original, 10MB → ~13.3MB base64
  if (body.image.length > 14_000_000) {
    return NextResponse.json(
      { error: "Image too large. Please use an image under 10 MB." },
      { status: 400 },
    );
  }

  try {
    const client = getClaude();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: body.mimeType,
                data: body.image,
              },
            },
            {
              type: "text",
              text: SYNTH_PROMPT,
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "max_tokens") {
      throw new Error("Response was cut off. Try a smaller or simpler image.");
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
    const message = err instanceof Error ? err.message : "Image import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

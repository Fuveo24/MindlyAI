import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

interface ImportCodeRequest {
  description: string;
  language?: string;
}

export interface CodeBlock {
  title: string;
  language: string;
  code: string;
  description: string;
}

export interface CodeImportResult {
  title: string;
  language: string;
  blocks: CodeBlock[];
}

function buildPrompt(description: string, language: string): string {
  return `You are a senior software engineer. The user wants to build a program described below.
Break it into a linear pipeline of self-contained code blocks (functions, classes, or script sections).
Each block should be one clear, focused step in the program — together they form a complete working program.

Target language: ${language}
Program description: ${description}

Return ONLY a raw JSON object (no markdown, no code fences) in this exact shape:
{
  "title": "<short program name>",
  "language": "${language}",
  "blocks": [
    {
      "title": "<step name, e.g. 'Parse Arguments'>",
      "language": "${language}",
      "code": "<complete, runnable code for this step>",
      "description": "<one sentence: what this step does and why>"
    }
  ]
}

Rules:
- 3 to 8 blocks — each block is a distinct step/module
- Code in each block must be complete and correct ${language} — not pseudocode
- Include all necessary imports/requires at the top of the first block that needs them
- Blocks flow logically left to right: output of one feeds into the next
- descriptions ≤ 25 words
- Raw JSON only, no prose around it`;
}

/**
 * POST /api/ai/import-code
 *
 * Generates a sequential chain of code blocks forming a complete program.
 * Used by Code Mode to populate the canvas with connected CodeNodes.
 */
export async function POST(req: Request) {
  let body: ImportCodeRequest;
  try {
    body = (await req.json()) as ImportCodeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.description?.trim()) {
    return NextResponse.json(
      { error: "A program description is required." },
      { status: 400 },
    );
  }

  const language = body.language?.trim() || "javascript";
  const prompt = buildPrompt(body.description.trim(), language);

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    // Strip any accidental markdown fences
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("Model did not return valid JSON.");
    }

    const result = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as CodeImportResult;

    if (!Array.isArray(result.blocks) || result.blocks.length === 0) {
      throw new Error("No code blocks were generated.");
    }

    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Code generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export const runtime = "nodejs";
// Allow up to 5 min for audio download + Whisper transcription of longer videos
export const maxDuration = 300;

interface YoutubeRequest {
  url: string;
}

/** Extract the 11-character video ID from any common YouTube URL format */
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.trim().match(p);
    if (m) return m[1];
  }
  return null;
}

/**
 * Downloads the audio from a YouTube video using the ANDROID Innertube client,
 * which returns non-ciphered stream URLs and works without a decipher function.
 * The audio buffer is then sent to OpenAI Whisper for transcription.
 */
async function transcribeYouTube(videoId: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured in your environment.");
  }

  const { Innertube, ClientType } = await import("youtubei.js");

  // The ANDROID client bypasses YouTube's JS-based signature/cipher requirements
  const yt = await Innertube.create({
    client_type: ClientType.ANDROID,
    generate_session_locally: true,
  });

  // Check duration before downloading anything
  const info = await yt.getBasicInfo(videoId, { client: "ANDROID" });
  const durationSec = info.basic_info.duration ?? 0;

  if (durationSec === 0) {
    throw new Error(
      "Could not determine video duration — the video may be unavailable or private.",
    );
  }
  if (durationSec > 900) {
    throw new Error(
      `Video is ${Math.round(durationSec / 60)} minutes long. Please use videos under 15 minutes.`,
    );
  }

  // Stream audio (lowest bitrate to minimise bandwidth & processing time)
  const stream = await yt.download(videoId, {
    type: "audio",
    quality: "best",
    format: "any",
    client: "ANDROID",
  });

  // Collect stream into a Buffer
  const chunks: Uint8Array[] = [];
  const reader = (stream as ReadableStream<Uint8Array>).getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const audioBuffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));

  // Send to Whisper — ANDROID streams are mp4 audio
  const audioFile = new File([audioBuffer], "audio.m4a", { type: "audio/mp4" });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
  });

  return transcription.text;
}

const SYNTH_PROMPT = `You are given a transcript of a YouTube video.
Extract the key ideas and structure them as a mind map.

Return a JSON object (no markdown) in this exact shape:
{
  "title": "<concise video title>",
  "branches": [
    {
      "kind": "idea",
      "title": "<branch label>",
      "description": "<1-sentence summary>",
      "children": [
        { "kind": "idea", "title": "<point>", "description": "<detail>" }
      ]
    }
  ]
}

Rules:
- 4-7 top-level branches, 2-5 children per branch
- kind must be one of: idea, task, budget, place, event
- descriptions ≤ 20 words
- raw JSON only — no markdown, no code fences`;

/**
 * POST /api/ai/import-youtube
 *
 * Downloads YouTube audio via Innertube ANDROID client, transcribes with Whisper,
 * then synthesises a mind map structure with Claude.
 * Works on any public YouTube video under 15 minutes — no captions required.
 */
export async function POST(req: Request) {
  let body: YoutubeRequest;
  try {
    body = (await req.json()) as YoutubeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const videoId = extractVideoId(body.url ?? "");
  if (!videoId) {
    return NextResponse.json(
      { error: "Could not find a YouTube video ID in that URL." },
      { status: 400 },
    );
  }

  try {
    // Step 1: Download + Whisper transcription
    const transcript = await transcribeYouTube(videoId);

    // Step 2: Claude synthesises transcript → mind map JSON
    const client = new Anthropic();
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `${SYNTH_PROMPT}\n\n---TRANSCRIPT---\n${transcript.slice(0, 20000)}`,
        },
      ],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("Model returned an unexpected response.");
    }

    return NextResponse.json(JSON.parse(raw.slice(jsonStart, jsonEnd + 1)));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "YouTube import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import https from "node:https";

export const runtime = "nodejs";
export const maxDuration = 300;

interface YoutubeRequest {
  url: string;
}

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
 * Downloads a URL using node:https directly, bypassing Next.js's instrumented
 * global fetch (which interferes with YouTube's CDN responses).
 */
function downloadBuffer(urlStr: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const req = https.get(
      urlStr,
      {
        headers: {
          "User-Agent":
            "com.google.android.youtube/17.31.35 (Linux; U; Android 11) gzip",
          Accept: "*/*",
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`CDN responded with HTTP ${res.statusCode}`));
          return;
        }
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      },
    );
    req.on("error", reject);
  });
}

/**
 * Uses the Innertube ANDROID client (via youtubei.js) to get a direct audio
 * stream URL, then downloads it with node:https and transcribes with Whisper.
 *
 * Why this approach:
 * - ANDROID client returns pre-decrypted CDN URLs (no JS decipher needed)
 * - node:https bypasses Next.js's fetch instrumentation which breaks CDN downloads
 */
async function transcribeYouTube(videoId: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in your .env.local.");
  }

  const { Innertube, ClientType } = await import("youtubei.js");

  const yt = await Innertube.create({
    client_type: ClientType.ANDROID,
    generate_session_locally: true,
  });

  const info = await yt.getBasicInfo(videoId, { client: "ANDROID" });

  const durationSec = info.basic_info.duration ?? 0;
  if (durationSec === 0) {
    throw new Error(
      "Video not found or unavailable.",
    );
  }
  if (durationSec > 900) {
    throw new Error(
      `Video is ${Math.round(durationSec / 60)} min long — please use videos under 15 minutes.`,
    );
  }

  // Pick the lowest-bitrate audio-only format to minimise download size
  const formats = info.streaming_data?.adaptive_formats ?? [];
  const audioFmt = formats
    .filter((f) => f.has_audio && !f.has_video && f.url)
    .sort((a, b) => (a.average_bitrate ?? 999999) - (b.average_bitrate ?? 999999))[0];

  if (!audioFmt?.url) {
    throw new Error("No audio stream available for this video.");
  }

  // Download via node:https to bypass Next.js fetch instrumentation
  const audioBuffer = await downloadBuffer(audioFmt.url);

  // Determine container from mime type (e.g. "audio/mp4" → "m4a")
  const mimeMatch = audioFmt.mime_type.match(/^audio\/([^;]+)/);
  const container = mimeMatch?.[1] ?? "mp4";
  const ext = container === "mp4" ? "m4a" : container;

  const audioFile = new File([audioBuffer], `audio.${ext}`, {
    type: `audio/${container}`,
  });

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
    const transcript = await transcribeYouTube(videoId);

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

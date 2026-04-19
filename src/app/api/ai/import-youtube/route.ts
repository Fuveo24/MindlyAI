import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 120;

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
 * Fetches the transcript for a YouTube video using the caption tracks
 * embedded in the page's ytInitialPlayerResponse (via youtubei.js).
 *
 * YouTube's audio CDN now requires PO Tokens for server-side access, so
 * we extract captions instead — which work without any special auth,
 * cover virtually all English videos (auto-generated), and are faster
 * than downloading + transcribing audio.
 */
async function getTranscript(videoId: string): Promise<string> {
  const { Innertube } = await import("youtubei.js");

  const yt = await Innertube.create({ generate_session_locally: true });
  const info = await yt.getBasicInfo(videoId);

  const durationSec = info.basic_info.duration ?? 0;
  if (durationSec === 0) {
    throw new Error("Video not found or unavailable.");
  }
  if (durationSec > 900) {
    throw new Error(
      `Video is ${Math.round(durationSec / 60)} min long — please use videos under 15 minutes.`,
    );
  }

  const tracks = info.captions?.caption_tracks ?? [];
  if (tracks.length === 0) {
    throw new Error(
      "No captions found for this video. YouTube import works with videos that have auto-generated or manual captions (most English videos qualify).",
    );
  }

  // Prefer English captions; fall back to first available track
  const track =
    tracks.find((t) => t.language_code?.startsWith("en")) ?? tracks[0];

  // Fetch as JSON3 — structured caption events with timed text segments
  const captionUrl = track.base_url + "&fmt=json3";
  const res = await fetch(captionUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch captions (HTTP ${res.status}).`);
  }

  const data = (await res.json()) as {
    events?: Array<{ segs?: Array<{ utf8?: string }> }>;
  };

  const transcript = (data.events ?? [])
    .filter((e) => e.segs)
    .map((e) => e.segs!.map((s) => s.utf8 ?? "").join(""))
    .join(" ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!transcript) {
    throw new Error("Caption track was empty.");
  }

  return transcript;
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
    const transcript = await getTranscript(videoId);

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
      message.content[0].type === "text"
        ? message.content[0].text.trim()
        : "";
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("Model returned an unexpected response.");
    }

    return NextResponse.json(JSON.parse(raw.slice(jsonStart, jsonEnd + 1)));
  } catch (err) {
    console.error("[import-youtube]", err);
    const message =
      err instanceof Error ? err.message : "YouTube import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

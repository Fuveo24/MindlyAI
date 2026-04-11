import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-side Claude client. Never import this from a client component —
 * the API key is read from process.env and must stay on the server.
 */
export function getClaude() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your .env.local file.",
    );
  }
  return new Anthropic({ apiKey });
}

export const CLAUDE_MODEL = "claude-sonnet-4-6";

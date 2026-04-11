export type Persona = "default" | "analyst" | "entrepreneur" | "engineer" | "creative" | "investor";

export interface PersonaDef {
  id: Persona;
  label: string;
  icon: string;
  color: string;
  systemPrompt: string;
}

export const PERSONAS: PersonaDef[] = [
  {
    id: "default",
    label: "Default",
    icon: "✦",
    color: "text-accent-glow border-accent-violet/30",
    systemPrompt:
      "You are a helpful idea expansion assistant embedded in a mind-map tool.",
  },
  {
    id: "analyst",
    label: "Analyst",
    icon: "📊",
    color: "text-sky-300 border-sky-500/30",
    systemPrompt:
      "You are a strategic analyst. Be logical, structured, and data-driven. Focus on metrics, clarity of scope, and completeness. Flag vague items.",
  },
  {
    id: "entrepreneur",
    label: "Founder",
    icon: "🚀",
    color: "text-emerald-300 border-emerald-500/30",
    systemPrompt:
      "You are a startup founder mindset. Focus on monetization, speed-to-market, traction strategies, and avoiding over-engineering. Be bold and commercially focused.",
  },
  {
    id: "engineer",
    label: "Engineer",
    icon: "⚙",
    color: "text-cyan-300 border-cyan-500/30",
    systemPrompt:
      "You are a senior software engineer. Decompose ideas into technical tasks, highlight dependencies, consider scalability and implementation effort. Be precise.",
  },
  {
    id: "creative",
    label: "Creative",
    icon: "🎨",
    color: "text-fuchsia-300 border-fuchsia-500/30",
    systemPrompt:
      "You are a creative director. Explore unexpected angles, associations, and lateral thinking. Push boundaries, suggest unconventional ideas, think visually and narratively.",
  },
  {
    id: "investor",
    label: "Investor",
    icon: "💼",
    color: "text-amber-300 border-amber-500/30",
    systemPrompt:
      "You are a venture investor. Evaluate from ROI, risk, market size, and competitive moat perspectives. Identify red flags, unknowns, and what would excite or concern a board.",
  },
];

export function getPersona(id: Persona): PersonaDef {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#07070c",
          elevated: "#0f0f17",
          card: "#13131d",
        },
        border: {
          subtle: "#1c1c2a",
          strong: "#2a2a3d",
        },
        text: {
          primary: "#ffffff",
          muted: "#8b8ba7",
          faint: "#5a5a75",
        },
        accent: {
          violet: "#8b5cf6",
          indigo: "#6366f1",
          glow: "#a78bfa",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "glow-radial":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139,92,246,0.35), transparent 70%)",
        "glow-bottom":
          "radial-gradient(ellipse 60% 40% at 50% 120%, rgba(99,102,241,0.25), transparent 70%)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(139,92,246,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(139,92,246,0.5)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

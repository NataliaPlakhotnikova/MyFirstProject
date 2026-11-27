import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        loto: {
          bg: "#0a0e1a",
          panel: "rgba(15, 23, 42, 0.72)",
          cyan: "#22d3ee",
          magenta: "#e879f9",
          gold: "#fbbf24",
          gpb: "#003da5",
        },
      },
      boxShadow: {
        neon: "0 0 24px rgba(34, 211, 238, 0.35)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.45)",
      },
      animation: {
        "barrel-in": "barrel-in 0.45s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
      keyframes: {
        "barrel-in": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
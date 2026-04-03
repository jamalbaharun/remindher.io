import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#0F172A",
        "surface-mid": "#1E293B",
        "surface-highest": "#253348",
        "neon-purple": "#BF00FF",
        "neon-purple-dim": "#d692ff",
        "neon-cyan": "#00FFFF",
        "neon-red": "#ff3b5c",
        "on-surface-variant": "#94A3B8",
        "outline-dim": "#334155",
      },
      fontFamily: { sans: ["Inter", "sans-serif"] },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "pulse-fast": "pulse 0.6s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;

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
        // Brand Colors - Quran LMS
        parchment: "#F9F9F7",
        cream: "#F2F0EB",
        ink: "#1A1A1A",
        oxblood: "#8C4A45",
        navy: "#2C3E50",
        gold: "#C5A065",
        sage: "#6B8E23",
      },
      fontFamily: {
        arabic: ["KFGQPC Uthmanic Script HAFS", "Scheherazade New", "Amiri Quran", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;

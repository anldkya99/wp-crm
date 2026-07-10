import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#05080A",
        panel: "#0B1718",
        panelSoft: "#0E1F20",
        line: "#1C3434",
        graphite: "#132728",
        surface: "#0B1718",
        surfaceSoft: "#0E1F20",
        surfaceStrong: "#071113",
        mint: "#4BA88F",
        gold: "#C8A45D",
        amber: "#C8A45D",
        coral: "#f06f64"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(200, 164, 93, 0.16), 0 24px 70px rgba(0, 0, 0, 0.42)",
        "op-xs": "0 1px 0 rgba(244, 241, 234, 0.035), 0 10px 24px rgba(0, 0, 0, 0.18)",
        "op-sm": "0 1px 0 rgba(244, 241, 234, 0.045), 0 18px 42px rgba(0, 0, 0, 0.24)",
        "op-md": "0 1px 0 rgba(244, 241, 234, 0.05), 0 26px 70px rgba(0, 0, 0, 0.30)",
        "op-lg": "0 1px 0 rgba(244, 241, 234, 0.06), 0 34px 96px rgba(0, 0, 0, 0.38)"
      }
    }
  },
  plugins: []
};

export default config;

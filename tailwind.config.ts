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
        mint: "#4BA88F",
        gold: "#C8A45D",
        amber: "#C8A45D",
        coral: "#f06f64"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(200, 164, 93, 0.16), 0 24px 70px rgba(0, 0, 0, 0.42)"
      }
    }
  },
  plugins: []
};

export default config;

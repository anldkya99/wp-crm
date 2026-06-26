import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#071113",
        panel: "#0d191c",
        panelSoft: "#122326",
        line: "#203337",
        mint: "#35d29a",
        amber: "#f4b85a",
        coral: "#f06f64"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(53, 210, 154, 0.18), 0 24px 70px rgba(0, 0, 0, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;

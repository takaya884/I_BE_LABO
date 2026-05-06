import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fbf7f4",
          100: "#f1ebe5",
          200: "#e2d7cb",
          300: "#cdbba8",
          500: "#8a7560",
          700: "#5a4a3a",
          900: "#2a211a",
        },
        accent: {
          50: "#eef9f6",
          100: "#d3efe7",
          200: "#a7dfcf",
          500: "#14a085",
          600: "#0f8870",
          700: "#0c6e5a",
          900: "#063d33",
        },
        coin: {
          50: "#fff7e6",
          100: "#ffe7b8",
          500: "#e0a23a",
          600: "#b97f1f",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Hiragino Sans",
          "Hiragino Kaku Gothic ProN",
          "Noto Sans JP",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 6px 24px -8px rgba(42, 33, 26, 0.12)",
        glow: "0 8px 32px -8px rgba(20, 160, 133, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand accent — confident SaaS indigo
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          500: "#4f46e5",
          600: "#4338ca",
          700: "#3730a3",
        },
        // Neutral surfaces — light SaaS canvas
        canvas: "#f6f7f9",
        panel: "#ffffff",
        ink: "#111827",
        muted: "#6b7280",
        faint: "#9ca3af",
        line: "#e5e7eb",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(16 24 40 / 0.05)",
        pop: "0 4px 16px -2px rgb(16 24 40 / 0.08), 0 2px 4px -1px rgb(16 24 40 / 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;

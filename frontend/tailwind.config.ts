import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#bcd2ff",
          300: "#8fb4ff",
          400: "#5c8cff",
          500: "#3b6cff",
          600: "#2f57e6",
          700: "#2645b4",
          800: "#1d3488",
          900: "#16265f",
        },
        ink: "#0b1020",
        "ink-deep": "#070a16",
        panel: "#0f1528",
        "panel-2": "#141c33",
        muted: "#8892b0",
        neon: {
          cyan: "#22d3ee",
          violet: "#a78bfa",
          magenta: "#f472b6",
          lime: "#a3e635",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(59,108,255,0.25), 0 8px 30px -8px rgba(59,108,255,0.45)",
        "glow-cyan":
          "0 0 0 1px rgba(34,211,238,0.25), 0 8px 30px -8px rgba(34,211,238,0.4)",
        lift: "0 18px 40px -18px rgba(0,0,0,0.85)",
        "inner-top": "inset 0 1px 0 0 rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
        "brand-sheen":
          "linear-gradient(120deg, #8fb4ff 0%, #ffffff 35%, #a78bfa 70%, #22d3ee 100%)",
      },
      backgroundSize: {
        grid: "44px 44px",
        sheen: "200% 100%",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.22, 1.4, 0.36, 1)",
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translate3d(0, 14px, 0)" },
          "100%": { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up-blur": {
          "0%": {
            opacity: "0",
            filter: "blur(6px)",
            transform: "translate3d(0, 18px, 0)",
          },
          "100%": {
            opacity: "1",
            filter: "blur(0)",
            transform: "translate3d(0, 0, 0)",
          },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        sheen: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.7)", opacity: "0.7" },
          "70%": { transform: "scale(2.2)", opacity: "0" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        "glow-breathe": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.75" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "33%": { transform: "translate3d(4%, -6%, 0) scale(1.08)" },
          "66%": { transform: "translate3d(-5%, 4%, 0) scale(0.95)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "radar-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "bounce-dot": {
          "0%, 80%, 100%": { transform: "translateY(0)", opacity: "0.35" },
          "40%": { transform: "translateY(-5px)", opacity: "1" },
        },
        "bar-grow": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.5s ease both",
        "scale-in": "scale-in 0.4s cubic-bezier(0.22, 1.4, 0.36, 1) both",
        "slide-up-blur":
          "slide-up-blur 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 1.8s infinite",
        sheen: "sheen 6s linear infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-breathe": "glow-breathe 5s ease-in-out infinite",
        drift: "drift 22s ease-in-out infinite",
        "spin-slow": "spin-slow 26s linear infinite",
        "radar-sweep": "radar-sweep 4s linear infinite",
        "bounce-dot": "bounce-dot 1.2s ease-in-out infinite",
        "bar-grow": "bar-grow 1s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};
export default config;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
        serif: ["Instrument Serif", "serif"],
        body: ["Plus Jakarta Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        primary: "#6366f1",
        "primary-dark": "#4f46e5",
        "primary-light": "#eef2ff",
        "primary-mid": "#e0e7ff",
        accent: "#8b5cf6",
        cyan: "#06b6d4",
        surface: "#ffffff",
        muted: "#64748b",
        border: "#e2e8f0",
        bg: "#f8fafc",
        "bg-subtle": "#f1f5f9",
        ink: "#0f172a",
        "ink-light": "#334155",
        success: "#10b981",
        warn: "#f59e0b",
        danger: "#ef4444",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 30px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.04)",
        glow: "0 0 50px rgba(99,102,241,0.3)",
        "glow-sm": "0 0 20px rgba(99,102,241,0.2)",
        primary: "0 4px 14px rgba(99,102,241,0.4)",
        accent: "0 4px 14px rgba(139,92,246,0.4)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
    }
  },
  plugins: []
}

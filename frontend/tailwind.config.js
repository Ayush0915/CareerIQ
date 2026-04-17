export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:    ["Inter", "DM Sans", "sans-serif"],
        display: ["Inter", "DM Sans", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
      colors: {
        // Brand
        accent:        "#5147E5",
        "accent-dark": "#3D34C4",
        "accent-light":"#EEF0FE",
        "accent-mid":  "#D8DCFC",
        // Navy text
        navy:          "#1A1D2E",
        "navy-muted":  "#374151",
        // Neutrals
        surface:       "#FFFFFF",
        bg:            "#F5F6FA",
        "bg-card":     "#FFFFFF",
        "bg-hover":    "#F8F9FC",
        border:        "#E8EAF0",
        "border-focus":"#5147E5",
        muted:         "#6B7280",
        subtle:        "#9CA3AF",
        // Semantic
        success:       "#22C55E",
        "success-bg":  "#F0FDF4",
        "success-border":"#BBF7D0",
        warn:          "#F59E0B",
        "warn-bg":     "#FFFBEB",
        "warn-border": "#FDE68A",
        danger:        "#EF4444",
        "danger-bg":   "#FEF2F2",
        "danger-border":"#FECACA",
        info:          "#3B82F6",
        "info-bg":     "#EFF6FF",
      },
      boxShadow: {
        card:    "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-md":"0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        "card-lg":"0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04)",
        accent:  "0 4px 14px rgba(81,71,229,0.35)",
      },
      borderRadius: {
        DEFAULT: "8px",
        md:      "10px",
        lg:      "12px",
        xl:      "16px",
        "2xl":   "20px",
        "3xl":   "24px",
      },
      animation: {
        "skeleton":   "skeleton 1.5s ease-in-out infinite",
        "fade-up":    "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in":    "fadeIn 0.3s ease both",
        "slide-left": "slideLeft 0.35s cubic-bezier(0.16,1,0.3,1) both",
        "scan":       "scan 2s ease-in-out infinite",
      },
      keyframes: {
        skeleton:  { "0%,100%": { opacity:"0.5" }, "50%": { opacity:"1" } },
        fadeUp:    { from:{ opacity:"0", transform:"translateY(12px)" }, to:{ opacity:"1", transform:"translateY(0)" } },
        fadeIn:    { from:{ opacity:"0" }, to:{ opacity:"1" } },
        slideLeft: { from:{ opacity:"0", transform:"translateX(16px)" }, to:{ opacity:"1", transform:"translateX(0)" } },
        scan:      { "0%": { transform:"translateY(-100%)" }, "100%": { transform:"translateY(100%)" } },
      },
    },
  },
  plugins: [],
}

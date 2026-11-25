/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "375px",
      },
      colors: {
        hb: {
          navy: "var(--hb-navy)",
          "navy-hover": "var(--hb-navy-hover)",
          "navy-subtle": "var(--hb-navy-subtle)",
          brand: "var(--hb-orange)",
          "brand-text": "var(--hb-brand-text)",
          orange: "var(--hb-orange)",
          "orange-hover": "var(--hb-orange-hover)",
          "orange-subtle": "var(--hb-orange-subtle)",
          teal: "var(--hb-teal)",
          "teal-subtle": "var(--hb-teal-subtle)",
          cyan: "var(--hb-cyan)",
          "cyan-subtle": "var(--hb-cyan-subtle)",
          warm: "var(--hb-bg-warm)",
          muted: "var(--hb-bg-muted)",
          surface: "var(--hb-surface)",
          "surface-muted": "var(--hb-bg-subtle)",
          border: "var(--hb-border)",
          "border-strong": "var(--hb-border-strong)",
          "text-primary": "var(--hb-text-primary)",
          "text-secondary": "var(--hb-text-secondary)",
          "text-muted": "var(--hb-text-muted)",
        },
      },
      fontSize: {
        "hb-xs": ["12px", { lineHeight: "1.48", letterSpacing: "-0.008em" }],
        "hb-sm": ["14px", { lineHeight: "1.55", letterSpacing: "-0.01em" }],
        "hb-base": ["16px", { lineHeight: "1.62", letterSpacing: "-0.012em" }],
        "hb-lg": ["18px", { lineHeight: "1.46", letterSpacing: "-0.016em" }],
        "hb-xl": ["21px", { lineHeight: "1.36", letterSpacing: "-0.018em" }],
        "hb-2xl": ["26px", { lineHeight: "1.28", letterSpacing: "-0.022em" }],
        "hb-3xl": ["32px", { lineHeight: "1.22", letterSpacing: "-0.024em" }],
      },
      fontFamily: {
        sans: [
          '"Pretendard Variable"',
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          '"Helvetica Neue"',
          '"Segoe UI"',
          '"Apple SD Gothic Neo"',
          '"Noto Sans KR"',
          '"Malgun Gothic"',
          "sans-serif",
        ],
        mono: [
          '"Pretendard Variable"',
          "Pretendard",
          '"SF Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "sans-serif",
        ],
      },
      boxShadow: {
        "2xs": "0 1px 2px 0 rgba(20, 26, 35, 0.03)",
        xs: "0 2px 6px -2px rgba(20, 26, 35, 0.04)",
        card: "0 1px 2px rgba(20, 26, 35, 0.03), 0 4px 12px -6px rgba(20, 26, 35, 0.05)",
        "card-hover":
          "0 2px 6px rgba(20, 26, 35, 0.04), 0 10px 22px -10px rgba(20, 26, 35, 0.09)",
        floating:
          "0 14px 32px -10px rgba(20, 26, 35, 0.18), 0 3px 10px -2px rgba(20, 26, 35, 0.08)",
        "glass-sm":
          "0 2px 10px -4px rgba(20, 26, 35, 0.04)",
      },
    },
  },
  plugins: [],
};

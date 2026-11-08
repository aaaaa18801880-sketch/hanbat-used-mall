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
      fontSize: {
        "hb-xs": ["12px", { lineHeight: "1.45", letterSpacing: "-0.01em" }],
        "hb-sm": ["14px", { lineHeight: "1.52", letterSpacing: "-0.014em" }],
        "hb-base": ["16px", { lineHeight: "1.6", letterSpacing: "-0.018em" }],
        "hb-lg": ["18px", { lineHeight: "1.44", letterSpacing: "-0.022em" }],
        "hb-xl": ["21px", { lineHeight: "1.34", letterSpacing: "-0.026em" }],
        "hb-2xl": ["26px", { lineHeight: "1.26", letterSpacing: "-0.03em" }],
        "hb-3xl": ["32px", { lineHeight: "1.2", letterSpacing: "-0.034em" }],
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
      colors: {
        hb: {
          navy: "var(--hb-navy)",
          "navy-hover": "var(--hb-navy-hover)",
          "navy-subtle": "var(--hb-navy-subtle)",
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
          border: "var(--hb-border)",
          "border-strong": "var(--hb-border-strong)",
        },
      },
      boxShadow: {
        "2xs": "0 1px 2px 0 rgba(20, 26, 35, 0.03)",
        xs: "0 2px 6px -1px rgba(20, 26, 35, 0.05)",
        card: "0 4px 20px -4px rgba(20, 26, 35, 0.06), 0 1px 3px 0 rgba(20, 26, 35, 0.03)",
        "card-hover":
          "0 14px 32px -8px rgba(20, 26, 35, 0.12), 0 4px 12px -2px rgba(20, 26, 35, 0.05)",
        floating:
          "0 20px 44px -10px rgba(20, 26, 35, 0.24), 0 4px 14px -2px rgba(20, 26, 35, 0.1)",
        "glass-sm":
          "0 4px 20px -4px rgba(20, 26, 35, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

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
        "hb-xs": ["12px", { lineHeight: "1.5" }],
        "hb-sm": ["14px", { lineHeight: "1.55" }],
        "hb-base": ["16px", { lineHeight: "1.65" }],
        "hb-lg": ["18px", { lineHeight: "1.45" }],
        "hb-xl": ["22px", { lineHeight: "1.35" }],
        "hb-2xl": ["28px", { lineHeight: "1.3" }],
        "hb-3xl": ["36px", { lineHeight: "1.22" }],
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
        "2xs": "0 1px 2px 0 rgb(14 26 43 / 0.03)",
        xs: "0 1px 3px 0 rgb(14 26 43 / 0.05)",
        card: "0 4px 20px -2px rgba(14, 26, 43, 0.05), 0 1px 3px 0 rgba(14, 26, 43, 0.03), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)",
        "card-hover":
          "0 16px 36px -6px rgba(14, 26, 43, 0.11), 0 4px 12px -2px rgba(14, 26, 43, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)",
        floating:
          "0 20px 44px -8px rgba(14, 26, 43, 0.26), 0 4px 12px -2px rgba(14, 26, 43, 0.12)",
        "glass-sm":
          "0 4px 16px -2px rgba(14, 26, 43, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.7)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

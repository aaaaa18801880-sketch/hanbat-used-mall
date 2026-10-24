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
        card: "0 6px 24px -4px rgba(14, 26, 43, 0.06), 0 2px 6px -1px rgba(14, 26, 43, 0.03)",
        "card-hover":
          "0 14px 32px -6px rgba(14, 26, 43, 0.10), 0 4px 10px -2px rgba(14, 26, 43, 0.04)",
        floating: "0 16px 40px -8px rgba(14, 26, 43, 0.22)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

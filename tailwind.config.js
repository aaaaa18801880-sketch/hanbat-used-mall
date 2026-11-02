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
        "hb-xs": ["12.5px", { lineHeight: "1.48", letterSpacing: "-0.008em" }],
        "hb-sm": ["14.5px", { lineHeight: "1.56", letterSpacing: "-0.014em" }],
        "hb-base": ["16px", { lineHeight: "1.64", letterSpacing: "-0.018em" }],
        "hb-lg": ["18px", { lineHeight: "1.46", letterSpacing: "-0.022em" }],
        "hb-xl": ["22px", { lineHeight: "1.36", letterSpacing: "-0.026em" }],
        "hb-2xl": ["28px", { lineHeight: "1.28", letterSpacing: "-0.03em" }],
        "hb-3xl": ["36px", { lineHeight: "1.22", letterSpacing: "-0.034em" }],
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
        "2xs": "0 1px 2px 0 rgba(25, 31, 40, 0.03)",
        xs: "0 2px 6px -1px rgba(25, 31, 40, 0.04)",
        card: "0 4px 24px -4px rgba(25, 31, 40, 0.05), 0 1px 3px 0 rgba(25, 31, 40, 0.02)",
        "card-hover":
          "0 16px 36px -8px rgba(25, 31, 40, 0.1), 0 4px 12px -2px rgba(25, 31, 40, 0.04)",
        floating:
          "0 20px 44px -10px rgba(25, 31, 40, 0.24), 0 4px 14px -2px rgba(25, 31, 40, 0.1)",
        "glass-sm":
          "0 4px 20px -4px rgba(25, 31, 40, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

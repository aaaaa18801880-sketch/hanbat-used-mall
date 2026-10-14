/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
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
        "2xs": "0 1px 2px 0 rgb(0 0 0 / 0.03)",
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        card: "0 4px 20px -2px rgba(14, 26, 43, 0.06)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

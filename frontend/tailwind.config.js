/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        app: {
          base: "var(--color-bg-base)",
          elevated: "var(--color-bg-elevated)",
          surface: "var(--color-bg-surface)",
          "surface-raised": "var(--color-bg-surface-raised)",
          "surface-muted": "var(--color-bg-surface-muted)",
          input: "var(--color-bg-input)",
          border: "var(--color-border)",
          "border-strong": "var(--color-border-strong)",
          text: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          accent: "var(--color-accent-primary)",
          "accent-2": "var(--color-accent-secondary)",
          cyan: "var(--color-accent-cyan)",
          fuchsia: "var(--color-accent-fuchsia)",
        },
      },
      boxShadow: {
        "app-card": "var(--color-shadow-card)",
      },
    },
  },
  plugins: [],
}

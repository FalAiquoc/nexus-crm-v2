/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    extend: {
      colors: {
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        "bg-main": "var(--bg-main)",
        "bg-sidebar": "var(--bg-sidebar)",
        "bg-card": "var(--bg-card)",
        "text-main": "var(--text-main)",
        "text-sec": "var(--text-sec)",
        "border-color": "var(--border-color)",
        "hover-color": "var(--hover-color)",
        "grad-start": "var(--grad-start)",
        "grad-end": "var(--grad-end)"
      }
    },
  },
  plugins: [],
}

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
        primary: "#D4AF37",
        secondary: "#F3E5AB",
        "bg-main": "#0A0A0A",
        "bg-sidebar": "#121212",
        "bg-card": "#1A1A1A",
        "text-main": "#F0EAD6",
        "text-sec": "#9A9A9A",
        "border-color": "#2A2A2A",
        "hover-color": "#D4AF37",
        "grad-start": "#B8860B",
        "grad-end": "#D4AF37"
      }
    },
  },
  plugins: [],
}

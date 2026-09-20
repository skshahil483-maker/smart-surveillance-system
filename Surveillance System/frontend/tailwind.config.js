/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surveillance: {
          dark: "#0b0f17",
          panel: "#0f172a",
          card: "#1e293b",
          border: "#334155",
          suspicious: "#ef4444",
          normal: "#10b981",
        }
      }
    },
  },
  plugins: [],
}

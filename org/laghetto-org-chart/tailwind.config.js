/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'laghetto-wine': '#0b1120',
        'laghetto-navy': '#111c33',
        'laghetto-blue-dark': '#1e3a8a',
        'laghetto-blue': '#2563eb',
        'laghetto-gold': '#3b82f6',
        'laghetto-ice': '#93c5fd',
      }
    },
  },
  plugins: [],
}

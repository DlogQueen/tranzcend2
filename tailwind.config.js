/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#121212', // Deep Charcoal
        primary: '#A855F7',    // Neon Purple
        secondary: '#14B8A6',  // Teal
        surface: '#1E1E1E',    // Slightly lighter charcoal for cards/modals
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
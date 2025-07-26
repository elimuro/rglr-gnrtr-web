/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./midi-help.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'midi-green': '#0f0',
        'midi-red': '#f00',
        'midi-yellow': '#ff0',
        'midi-dark': '#333',
        'midi-darker': '#222',
        'midi-light': '#ccc',
      },
      fontFamily: {
        'mono': ['Courier New', 'monospace'],
      },
      zIndex: {
        'midi': '1000',
      }
    },
  },
  plugins: [],
  // Important: Don't purge existing custom CSS classes
  corePlugins: {
    preflight: false, // Disable Tailwind's base styles to avoid conflicts
  },
} 
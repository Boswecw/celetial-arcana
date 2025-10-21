/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{svelte,ts}"],
  theme: {
    extend: {
      fontFamily: {
        decorative: ["'Cinzel Decorative'", "serif"],
        sans: ["'Inter'", "sans-serif"],
      },
      colors: {
        // New celestial color scheme
        celestial: {
          // Primary
          violet: "#7B61FF",
          // Secondary
          lilac: "#C6A7FF",
          // Background
          deepspace: "#0B0724",
          // Surface
          navy: "#17133A",
          // Accent
          magenta: "#FF4EDB",
          // Success
          green: "#4DF2B0",
          // Warning
          amber: "#FFC857",
          // Text
          white: "#EDEBFF",
          gray: "#B3A9C7",
        },
      },
      backgroundImage: {
        "celestial-gradient": "linear-gradient(135deg, #7B61FF, #FF4EDB)",
      },
    },
  },
  plugins: [],
};


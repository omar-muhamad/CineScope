/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "main-dark": "#10141E",
        "secondary-dark": "#161D2f",
        gray: "#5A698F",
        orange: "#FC4747",
      },
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        outfitLight: ["outfit-light", "sans-serif"],
        outfitMedium: ["outfit-medium", "sans-serif"],
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

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
        outfitLight: ["outfit-light", "sans-serif"],
        outfitMedium: ["outfit-medium", "sans-serif"],
      },
    },
  },
  plugins: [],
};

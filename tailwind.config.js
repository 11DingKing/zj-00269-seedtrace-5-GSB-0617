/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#1B4332",
        },
        bark: {
          50: "#fef9ec",
          100: "#fdf0c8",
          200: "#fae09c",
          300: "#f5cb5e",
          400: "#f0b836",
          500: "#e49b10",
          600: "#c47a08",
          700: "#a35809",
          800: "#8B6914",
          900: "#7a4a0d",
          950: "#462605",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

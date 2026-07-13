/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9f6",
          100: "#d9f0e6",
          500: "#0f9d6f",
          600: "#0c8a60",
          700: "#0a7350",
        },
      },
    },
  },
  plugins: [],
};

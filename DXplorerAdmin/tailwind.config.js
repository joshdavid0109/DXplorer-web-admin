/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#154689',
        'secondary': '#FAAD2B',
        'shadow': '#8D8D8D',

      }
    },
  },
  plugins: [],
}
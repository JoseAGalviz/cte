/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1A9888',
          dark: '#176e5b',
          light: '#eaf6f6',
        },
      },
    },
  },
  plugins: [],
}


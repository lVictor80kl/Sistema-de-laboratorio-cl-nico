/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#4F46E5',
        'brand-teal': '#0D9488',
        'alert-red': '#EF4444',
        'olive': {
          600: '#4a5d23',
          800: '#3a4a1c',
        },
        'brown': {
          500: '#a67c52',
          700: '#8b6443',
        }
      }
    },
  },
  plugins: [],
}

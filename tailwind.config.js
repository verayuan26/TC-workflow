/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fdf9e4',
          100: '#f8efbe',
          200: '#f0dd82',
          300: '#e5c84a',
          400: '#d4af37',
          500: '#b8922e',
          600: '#9a7826',
          700: '#7d601f',
          800: '#604a18',
          900: '#433312',
        },
        // Warm charcoal — the core design token for backgrounds, borders, text
        surface: {
          50:  '#f7f2e4',  // brightest warm off-white
          100: '#ede5cc',  // headings, important labels
          200: '#c8c1ae',  // normal body text
          300: '#a09a8c',  // secondary text
          400: '#7a7769',  // muted text
          500: '#5a5749',  // very muted / disabled
          600: '#3c3a31',  // subtle elements
          700: '#302e27',  // borders, dividers
          800: '#252420',  // card backgrounds
          900: '#1e1d1a',  // sidebar, panels, header
          950: '#181816',  // page background (warm charcoal, not pure black)
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Brand gold: low-saturation champagne gold ─────────────────────
        gold: {
          50:  '#FAF5E8',
          100: '#F2E8CC',
          200: '#E5D3A4',
          300: '#D6C08B',   // light champagne gold
          400: '#B89A5E',   // main brand gold (softened from #D4AF37)
          500: '#A08548',   // medium gold-brown
          600: '#8A6A35',   // deep gold-brown
          700: '#6F5228',
          800: '#4F3B1C',
          900: '#2E2210',
        },
        // ── Warm charcoal surface palette ─────────────────────────────────
        surface: {
          50:  '#F4EFE4',   // main title / brightest warm
          100: '#E8E0D0',   // headings
          200: '#D8D1C3',   // body text
          300: '#C0B8A8',   // secondary text (slightly brighter than before)
          400: '#A8A094',   // secondary text
          500: '#7D766C',   // auxiliary / muted text
          600: '#5F5A52',   // disabled / weakest text
          700: '#3A3730',   // borders, dividers
          800: '#28251F',   // secondary card / overlay
          900: '#211F1B',   // card background
          950: '#181715',   // sidebar / panels
          1000:'#141414',   // page background
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'card': '14px',
      },
      boxShadow: {
        'card': '0 10px 30px rgba(0, 0, 0, 0.18)',
        'card-hover': '0 14px 36px rgba(0, 0, 0, 0.24)',
      },
    },
  },
  plugins: [],
};

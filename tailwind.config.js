/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2d457c',
          gray: '#d2d6de',
          gold: '#dba620',
          'light-blue': '#e8edf5',
          'mid-blue': '#93b4d9',
        },
      },
      fontFamily: {
        sans: ['"Open Sans"', 'sans-serif'],
      },
      keyframes: {
        slideFromRight: {
          from: { transform: 'translateX(48px)', opacity: '0' },
          to:   { transform: 'translateX(0)',    opacity: '1' },
        },
        slideFromLeft: {
          from: { transform: 'translateX(-48px)', opacity: '0' },
          to:   { transform: 'translateX(0)',     opacity: '1' },
        },
        modalIn: {
          from: { opacity: '0', transform: 'scale(0.95) translateY(-10px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        'slide-from-right': 'slideFromRight 0.22s ease-out',
        'slide-from-left':  'slideFromLeft 0.22s ease-out',
        'modal-in':         'modalIn 0.18s ease-out',
        'fade-in':          'fadeIn 0.15s ease-out',
      },
    },
  },
  plugins: [],
}

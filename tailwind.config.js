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
          from: { transform: 'translateX(48px)', opacity: '0', filter: 'blur(8px)' },
          to:   { transform: 'translateX(0)',    opacity: '1', filter: 'blur(0px)' },
        },
        slideFromLeft: {
          from: { transform: 'translateX(-48px)', opacity: '0', filter: 'blur(8px)' },
          to:   { transform: 'translateX(0)',     opacity: '1', filter: 'blur(0px)' },
        },
        modalIn: {
          from: { opacity: '0', transform: 'scale(0.95) translateY(-10px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        pulseBlue: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(147, 180, 217, 0.0)' },
          '50%':      { boxShadow: '0 0 0 4px rgba(147, 180, 217, 0.55)' },
        },
      },
      animation: {
        'slide-from-right': 'slideFromRight 0.28s ease-out',
        'slide-from-left':  'slideFromLeft 0.28s ease-out',
        'modal-in':         'modalIn 0.18s ease-out',
        'fade-in':          'fadeIn 0.15s ease-out',
        'pulse-blue':       'pulseBlue 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

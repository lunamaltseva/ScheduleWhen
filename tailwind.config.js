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
          '0%':   { transform: 'translateX(90px) scaleX(1.06)', opacity: '0', filter: 'blur(14px)' },
          '60%':  { filter: 'blur(5px)' },
          '100%': { transform: 'translateX(0) scaleX(1)',       opacity: '1', filter: 'blur(0px)' },
        },
        slideFromLeft: {
          '0%':   { transform: 'translateX(-90px) scaleX(1.06)', opacity: '0', filter: 'blur(14px)' },
          '60%':  { filter: 'blur(5px)' },
          '100%': { transform: 'translateX(0) scaleX(1)',        opacity: '1', filter: 'blur(0px)' },
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
        'slide-from-right': 'slideFromRight 0.42s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-from-left':  'slideFromLeft 0.42s cubic-bezier(0.22, 1, 0.36, 1)',
        'modal-in':         'modalIn 0.18s ease-out',
        'fade-in':          'fadeIn 0.15s ease-out',
        'pulse-blue':       'pulseBlue 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

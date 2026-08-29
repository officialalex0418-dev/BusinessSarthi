/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
        },
        accent: {
          DEFAULT: '#10b981',
          hover: '#059669',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'slide-up': 'slide-up 0.5s ease-out forwards',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        }
      },
      boxShadow: {
        '3d': '0 20px 50px -12px rgba(0, 0, 0, 0.15)',
        '3d-hover': '0 30px 60px -12px rgba(37, 99, 235, 0.2)',
        'glass': 'inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.perspective-1000': {
          perspective: '1000px',
        },
        '.preserve-3d': {
          'transform-style': 'preserve-3d',
        },
        '.backface-hidden': {
          'backface-visibility': 'hidden',
        },
        '.rotate-y-10': {
          transform: 'rotateY(10deg)',
        },
        '.rotate-y-20': {
          transform: 'rotateY(20deg)',
        },
        '.rotate-x-10': {
          transform: 'rotateX(10deg)',
        },
        '.-rotate-x-10': {
          transform: 'rotateX(-10deg)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
};

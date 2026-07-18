/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        brand: {
          light: 'rgb(var(--color-brand-light) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-brand) / <alpha-value>)',
          dark: 'rgb(var(--color-brand-dark) / <alpha-value>)',
          deep: 'rgb(var(--color-brand-deep) / <alpha-value>)',
        },
        'caps-blue': {
          light: 'rgb(var(--color-brand-light) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-brand) / <alpha-value>)',
          dark: 'rgb(var(--color-brand-dark) / <alpha-value>)',
          deep: 'rgb(var(--color-brand-deep) / <alpha-value>)',
        },
        'pills-pink': {
          light: '#FFF0F5',
          DEFAULT: '#F83F7D',
          dark: '#D6336C',
          deep: '#C2255C',
        },
        'brand-teal': {
          DEFAULT: 'rgb(var(--color-brand) / <alpha-value>)',
          dark: 'rgb(var(--color-brand-dark) / <alpha-value>)',
        },
        accent: {
          light: '#fef3c7',
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
        success: '#4ade80',
        dark: '#1a1a1a',
      },

      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'heart-pop': 'heartPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'badge-bounce': 'badgeBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'toast-in': 'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(-8px)' },
          '50%': { transform: 'translateY(8px)' },
        },
        heartPop: {
          '0%': { transform: 'scale(0.8)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        badgeBounce: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.4)' },
          '100%': { transform: 'scale(1)' },
        },
        toastIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

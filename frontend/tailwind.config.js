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
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bcfd',
          400: '#8198fa',
          500: '#6171f6',
          600: '#4f52eb',
          700: '#4040d0',
          800: '#3636a8',
          900: '#303185',
          950: '#1e1d50',
        },
        dark: {
          900: '#0a0a1a',
          800: '#0f0f2a',
          700: '#141430',
          600: '#1a1a40',
          500: '#222255',
          400: '#2d2d6b',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateY(-10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        glow: {
          from: { boxShadow: '0 0 10px rgba(97, 113, 246, 0.3)' },
          to: { boxShadow: '0 0 25px rgba(97, 113, 246, 0.7), 0 0 50px rgba(97, 113, 246, 0.3)' },
        },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(97,113,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(97,113,246,0.05) 1px, transparent 1px)",
        'hero-gradient': 'linear-gradient(135deg, #0a0a1a 0%, #141430 50%, #0f0f2a 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(97,113,246,0.1) 0%, rgba(97,113,246,0.02) 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

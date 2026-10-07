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
          500: '#6366f1', // AI Indigo Primary
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        dark: {
          950: '#060810', // Deepest Canvas OLED
          900: '#0b0f19', // Main Dark Canvas
          850: '#0f172a', // Card Canvas
          800: '#141e33', // Elevated Surface
          700: '#1e293b', // Borders & Insets
          600: '#334155', // Muted States
          500: '#475569',
          400: '#64748b',
        },
        ai: {
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          sky: '#38bdf8',
          pink: '#ec4899',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(99, 102, 241, 0.25)',
        'glow-md': '0 0 30px rgba(99, 102, 241, 0.35)',
        'glow-lg': '0 0 50px rgba(99, 102, 241, 0.45)',
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.35)',
        'glow-emerald': '0 0 25px rgba(16, 185, 129, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-subtle': 'pulseSubtle 2.5s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.35s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 4s linear infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateY(-8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'scale(0.99)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        glow: {
          from: { boxShadow: '0 0 10px rgba(99, 102, 241, 0.3)' },
          to: { boxShadow: '0 0 25px rgba(99, 102, 241, 0.7), 0 0 50px rgba(99, 102, 241, 0.25)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
        'hero-gradient': 'linear-gradient(135deg, #060810 0%, #0b0f19 50%, #0f172a 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(15, 23, 42, 0.7) 0%, rgba(11, 15, 25, 0.8) 100%)',
        'glass-gradient': 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      },
    },
  },
  plugins: [],
}

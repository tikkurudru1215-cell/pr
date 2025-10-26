/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
      colors: {
        // --- BASE COLORS (Light Theme) ---
        backgroundLight: '#f0f4f8', // Very light slate/off-white (Main Background)
        backgroundCard: '#ffffff', // Pure white for cards/elements
        textDark: '#1e293b', // Deep Slate for primary text
        textMuted: '#64748b', // Medium Slate for secondary text
        // --- PRIMARY: Standard Deep Blue (Corporate/Govt Look) ---
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Core Blue
          600: '#2563eb', 
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // --- ACCENT 1: Professional Teal/Cyan (Modern Tech) ---
        accentPrimary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // Core Teal
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        // --- ACCENT 2: Muted Orange/Saffron (Retained for contrast) ---
        accentSecondary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        }
      },
      animation: {
        'pulse-ring': 'pulse-ring 1s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%': {
            transform: 'scale(0.33)',
          },
          '40%, 50%': {
            opacity: '0.8',
          },
          '100%': {
            opacity: '0',
            transform: 'scale(1.1)',
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
      },
    },
  },
  plugins: [],
};
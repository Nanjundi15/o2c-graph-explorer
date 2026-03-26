/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:  { 950: '#060912', 900: '#0A0F1E', 800: '#111827', 700: '#1a2235', 600: '#1e293b' },
        cyan:  { 400: '#22d3ee', 300: '#67e8f9', 500: '#06b6d4' },
        amber: { 400: '#fbbf24', 300: '#fcd34d' },
        rose:  { 400: '#fb7185' },
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%':   { boxShadow: '0 0 5px #22d3ee44' },
          '100%': { boxShadow: '0 0 20px #22d3ee88, 0 0 40px #22d3ee33' },
        },
      },
    },
  },
  plugins: [],
}

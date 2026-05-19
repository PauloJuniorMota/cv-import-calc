/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        bg: '#07090f',
        surface: '#0d1117',
        border: '#1a2235',
        muted: '#1e2d45',
        accent: '#2563eb',
        'accent-soft': '#1d4ed8',
        'text-primary': '#e2e8f0',
        'text-secondary': '#64748b',
        'text-muted': '#334155',
        green: '#10b981',
        red: '#ef4444',
        amber: '#f59e0b',
        purple: '#8b5cf6',
        blue: '#3b82f6',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'count': 'countUp 0.8s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

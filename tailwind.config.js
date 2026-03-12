/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'grit-bg': '#0F172A',
        'grit-card': '#1E293B',
        'grit-border': '#334155',
        'grit-sky': '#38BDF8',
        'grit-gold': '#FFD700',
        'grit-muted': '#64748B',
        'grit-text': '#E2E8F0',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-clash)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'live-dot': 'liveDot 1.5s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'ticker': 'ticker 0.5s ease-out',
      },
      keyframes: {
        liveDot: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.3 },
        },
        slideUp: {
          from: { transform: 'translateY(8px)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        ticker: {
          from: { transform: 'translateY(-4px)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        }
      }
    },
  },
  plugins: [],
}

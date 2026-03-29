/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        // Named GritClub tokens
        obsidian: '#0B0B0C',
        charcoal: '#141416',
        surface:  '#1C1C1E',
        ember:    '#FF4D2D',
        copper:   '#C24E2A',
        ash:      '#8A817C',
        stone:    '#B0A8A3',
        gold:     '#A67C52',
      },
      fontFamily: {
        sans:    ["'Inter'", 'system-ui', 'sans-serif'],
        body:    ["'Inter'", 'system-ui', 'sans-serif'],
        display: ["'Sora'",  'system-ui', 'sans-serif'],
        heading: ["'Sora'",  'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'pulse-glow': {
          '0%,100%': { opacity: '0.35' },
          '50%':     { opacity: '0.85' },
        },
        'ember-flicker': {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.7', transform: 'scale(0.98)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'accordion-down':  'accordion-down 0.2s ease-out',
        'accordion-up':    'accordion-up 0.2s ease-out',
        'pulse-glow':      'pulse-glow 3s ease-in-out infinite',
        'ember-flicker':   'ember-flicker 2s ease-in-out infinite',
        float:             'float 6s ease-in-out infinite',
        ticker:            'ticker 28s linear infinite',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'void-bg': '#050508',
        'void-surface': '#0a0a0f',
        'void-elevated': '#111118',
        'void-border': 'rgba(255, 255, 255, 0.055)',
        'void-violet': '#8b5cf6',
        'void-violet-soft': '#a78bfa',
        'void-glow': '#7c3aed',
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(4rem, 12vw, 13rem)', { lineHeight: '0.95', letterSpacing: '-0.055em', fontWeight: '800' }],
        'display-lg': ['clamp(2.75rem, 6vw, 5.5rem)', { lineHeight: '1.0', letterSpacing: '-0.04em', fontWeight: '700' }],
        'display': ['clamp(2rem, 4vw, 3.5rem)', { lineHeight: '1.08', letterSpacing: '-0.03em', fontWeight: '600' }],
        'heading': ['clamp(1.4rem, 2.5vw, 2rem)', { lineHeight: '1.18', letterSpacing: '-0.025em', fontWeight: '600' }],
        'overline': ['0.68rem', { lineHeight: '1', letterSpacing: '0.18em', fontWeight: '600' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-down': {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'breathe': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.65' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.12', transform: 'scale(1)' },
          '50%': { opacity: '0.22', transform: 'scale(1.06)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'ticker-up': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-100%)', opacity: '0' },
        },
        'number-in': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'orbit': {
          '0%': { transform: 'rotate(0deg) translateX(60px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(60px) rotate(-360deg)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fade-in 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-down': 'fade-down 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'breathe': 'breathe 5s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 7s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'cursor-blink': 'cursor-blink 1s step-end infinite',
        'orbit': 'orbit 8s linear infinite',
        'scan-line': 'scan-line 3s linear infinite',
      },
    },
  },
  plugins: [],
};

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
        'void-bg': '#030307',
        'void-surface': '#09090D',
        'void-card': '#0D0D12',
        'void-border': '#1F1F24',
        'void-magenta': '#DF00FF',
        'void-purple': '#C084FC',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

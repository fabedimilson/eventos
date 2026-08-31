/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ifam: {
          green: {
            50: '#E8F5E9',
            100: '#C8E6C9',
            200: '#A5D6A7',
            500: '#4CAF50',
            600: '#2E7D32',
            700: '#1B5E20', // Cor Primária Oficial IFAM
            800: '#144618',
            900: '#0B290E',
          },
          red: {
            500: '#E53935',
            600: '#D32F2F',
            700: '#C62828', // Cor Secundária IFAM
            800: '#B71C1C',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

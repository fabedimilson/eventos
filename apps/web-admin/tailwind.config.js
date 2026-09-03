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
        unifik: {
          primary: '#8B5CF6', // Roxo Elétrico Oficial
          violet: {
            50: '#F5F3FF',
            100: '#EDE9FE',
            500: '#8B5CF6',
            600: '#7C3AED',
            700: '#6D28D9',
            900: '#4C1D95',
          },
          emerald: {
            50: '#ECFDF5',
            500: '#10B981',
            600: '#059669',
            700: '#047857',
          },
          slate: {
            900: '#0F172A',
            950: '#0B0F19',
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

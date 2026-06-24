/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        text: {
          DEFAULT: '#334155',
          muted: '#64748B',
        },
      },
      fontSize: {
        '1.5xl': '1.375rem',
      },
      fontFamily: {
        'avenir-next': ['avenir-next', 'sans-serif'],
        besley: ['besley', 'serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

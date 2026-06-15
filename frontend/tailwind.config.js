/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        amz: {
          dark:    '#131921',
          nav:     '#232F3E',
          orange:  '#FF9900',
          yellow:  '#FFD814',
          'yellow-hover': '#F7CA00',
          teal:    '#007185',
          red:     '#B12704',
          green:   '#007600',
          bg:      '#EAEDED',
          border:  '#D5D9D9',
          text:    '#0F1111',
        },
      },
    },
  },
  plugins: [],
}

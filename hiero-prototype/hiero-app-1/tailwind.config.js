module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        neonGreen: '#39FF14',
      },
      boxShadow: {
        'neon': '0 0 10px #39FF14, 0 0 20px #39FF14, 0 0 30px #39FF14',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
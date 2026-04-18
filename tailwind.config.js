/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        game: ['"Rajdhani"', 'sans-serif'],
      },
      colors: {
        hud: {
          green: '#00ff88',
          red: '#ff3344',
          amber: '#ffaa00',
          dark: 'rgba(0, 0, 0, 0.75)',
        },
      },
    },
  },
  plugins: [],
}

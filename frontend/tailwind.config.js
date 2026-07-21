/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0d12',
        surface: '#131820',
        border: '#161B22',
        gold: '#e8b84b',
        teal: '#3fd6c0',
        coral: '#E5484D',
        bone: '#ECEEF0',
        slate: '#8B96A5'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        body: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};
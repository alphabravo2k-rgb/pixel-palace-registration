/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        esports: {
          bg: '#0a0a0f',
          accent: '#00f5ff',
          warning: '#ff6b2b',
          panel: 'rgba(10, 10, 15, 0.75)',
        }
      },
      fontFamily: {
        heading: ['Rajdhani', 'sans-serif'],
        body: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
      },
    },
  },
  plugins: [],
}

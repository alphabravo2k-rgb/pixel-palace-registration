/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-pink': '#f000ff',
        'neon-purple': '#8a2be2',
        'neon-cyan': '#00f0ff',
        'bg-void': '#050507',
        'glass': 'rgba(15, 15, 20, 0.45)',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        heading: ['Teko', 'sans-serif'],
        body: ['"Space Grotesk"', 'sans-serif'],
        ui: ['Rajdhani', 'sans-serif'],
      },
      backgroundImage: {
        'void-engine': 'radial-gradient(circle at 50% 0%, rgba(138, 43, 226, 0.15) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(240, 0, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(0, 240, 255, 0.05) 0%, transparent 50%)',
        'scanlines': 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2))',
      },
      animation: {
        'breathe': 'breathe 20s ease-in-out infinite alternate',
      },
      keyframes: {
        breathe: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' },
        }
      }
    },
  },
  plugins: [],
}

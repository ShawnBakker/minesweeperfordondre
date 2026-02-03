/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a25',
          600: '#222230',
        },
        accent: {
          cyan: '#00e5ff',
          red: '#ff3d57',
          amber: '#ffab00',
          green: '#00e676',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        display: ['"Orbitron"', '"Rajdhani"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 229, 255, 0.15)',
        'glow-red': '0 0 20px rgba(255, 61, 87, 0.2)',
        'glow-green': '0 0 20px rgba(0, 230, 118, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'reveal': 'reveal 0.15s ease-out forwards',
        'shake': 'shake 0.5s ease-in-out',
        'float-in': 'floatIn 0.3s ease-out forwards',
      },
      keyframes: {
        reveal: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        floatIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Sampled from the SM Interiors logo — same palette as the website, so
           the panel and the site it edits never look like two products. */
        azure: {
          DEFAULT: '#29ABE2',
          light: '#68CDF7',
          bright: '#8FDDFF',
          deep: '#0E7FB8',
          dark: '#075A85',
        },
        night: {
          DEFAULT: '#050B14',
          soft: '#08121F',
          raised: '#0C1B2C',
          line: '#1B3049',
        },
        frost: {
          DEFAULT: '#EAF4FB',
          muted: '#9DB4C9',
          dim: '#6B8299',
        },
        /* Status colours, tuned to stay legible on the dark ground. */
        success: { DEFAULT: '#34D399', dim: '#065F46' },
        warning: { DEFAULT: '#FBBF24', dim: '#78350F' },
        danger: { DEFAULT: '#F87171', dim: '#7F1D1D' },
      },
      fontFamily: {
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      letterSpacing: { kicker: '0.22em' },
      boxShadow: {
        glass:
          '0 8px 32px rgba(2, 10, 20, 0.55), inset 0 1px 0 rgba(255,255,255,0.10)',
        'glass-lg':
          '0 24px 64px rgba(2, 10, 20, 0.6), inset 0 1px 0 rgba(255,255,255,0.14)',
        'glow-azure': '0 0 0 1px rgba(41,171,226,0.35), 0 8px 28px rgba(41,171,226,0.18)',
      },
      backgroundImage: {
        'azure-sheen':
          'linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 40%, rgba(41,171,226,0.10) 100%)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'scale-in': 'scale-in 0.18s ease-out',
        shimmer: 'shimmer 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

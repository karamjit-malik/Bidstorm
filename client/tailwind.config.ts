import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk Variable"', '"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // BidStorm brand — indigo→violet auction identity. Full ramp so borders,
        // fills, glows and text all draw from one coherent hue family.
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Accent — electric violet/fuchsia used sparingly for live/energy cues.
        accent: {
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
        },
        // Neutral surface ink — a slightly cool near-black for the dark canvas.
        ink: {
          900: '#0b0b13',
          950: '#07070d',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(99,102,241,0.15), 0 12px 40px -12px rgba(99,102,241,0.45)',
        'glow-lg': '0 0 60px -12px rgba(129,140,248,0.55)',
        card: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.18)',
        'card-hover': '0 2px 4px rgba(15,23,42,0.06), 0 24px 48px -16px rgba(79,70,229,0.35)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        'brand-radial': 'radial-gradient(120% 120% at 50% 0%, rgba(99,102,241,0.25) 0%, rgba(168,85,247,0.08) 40%, transparent 70%)',
        'grid-fade': 'linear-gradient(to bottom, rgba(99,102,241,0.08), transparent 60%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-pan': {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(168,85,247,0.5)' },
          '70%': { boxShadow: '0 0 0 8px rgba(168,85,247,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(168,85,247,0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'scroll-cue': {
          '0%,100%': { transform: 'translateY(0)', opacity: '0.4' },
          '50%': { transform: 'translateY(6px)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.8s ease-out both',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'gradient-pan': 'gradient-pan 8s ease infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite',
        marquee: 'marquee 30s linear infinite',
        'scroll-cue': 'scroll-cue 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;

import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Force a single light theme everywhere: no `.dark` class is ever applied, so
  // every legacy `dark:` utility across the app goes inert. The Mainframe theme
  // is light-only.
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"HelveticaNowDisplayW01-Rg"', '"Helvetica Neue"', 'Arial', 'system-ui', 'sans-serif'],
        display: ['"HelveticaNowDisplay-Medium"', '"Helvetica Neue"', 'Arial', 'system-ui', 'sans-serif'],
      },
      colors: {
        // "brand" is repurposed as a monochrome ink ramp — every legacy
        // brand-indigo accent (text-brand-600, bg-brand-600, …) now reads as
        // near-black, matching the Mainframe editorial look.
        brand: {
          50: '#f5f4f2',
          100: '#e7e5e2',
          200: '#d4d2cd',
          300: '#a8a5a0',
          400: '#78756f',
          500: '#3d3a36',
          600: '#1a1815',
          700: '#0d0b09',
          800: '#050505',
          900: '#000000',
          950: '#000000',
        },
        // Warm neutral ramp replacing Tailwind's cool slate — warms every
        // slate-* surface and text token app-wide in one shot.
        slate: {
          50: '#faf9f7',
          100: '#f3f1ec',
          200: '#e7e4de',
          300: '#d4cfc7',
          400: '#a8a29a',
          500: '#78726a',
          600: '#57534c',
          700: '#44403a',
          800: '#292520',
          900: '#1c1a16',
          950: '#0f0d0b',
        },
        // Editorial warm surfaces.
        paper: {
          DEFAULT: '#e9e7e2',
          light: '#f3f1ec',
          dark: '#d9d6cf',
        },
        ink: {
          DEFAULT: '#0a0a0a',
          900: '#111111',
          950: '#0a0a0a',
        },
      },
      boxShadow: {
        glow: '0 1px 2px rgba(0,0,0,0.05), 0 12px 32px -18px rgba(0,0,0,0.25)',
        'glow-lg': '0 20px 48px -24px rgba(0,0,0,0.35)',
        card: '0 1px 2px rgba(0,0,0,0.04), 0 10px 28px -18px rgba(0,0,0,0.16)',
        'card-hover': '0 2px 6px rgba(0,0,0,0.06), 0 22px 48px -22px rgba(0,0,0,0.24)',
      },
      backgroundImage: {
        // Kept for API compatibility with existing markup, but now monochrome.
        'brand-gradient': 'linear-gradient(180deg, #1a1815 0%, #0a0a0a 100%)',
        'brand-radial': 'radial-gradient(120% 120% at 50% 0%, rgba(0,0,0,0.06) 0%, transparent 70%)',
        'grid-fade': 'linear-gradient(to bottom, rgba(0,0,0,0.05), transparent 60%)',
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
          '0%': { boxShadow: '0 0 0 0 rgba(0,0,0,0.35)' },
          '70%': { boxShadow: '0 0 0 7px rgba(0,0,0,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(0,0,0,0)' },
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

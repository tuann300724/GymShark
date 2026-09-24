import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ===== Brand palette (Dark Cinematic + Neon Fitness) =====
        ink: '#0B0D0F', // background
        surface: '#15191D', // secondary background / card
        neon: {
          DEFAULT: '#B7FF00', // primary accent
          hover: '#D0FF4D', // primary hover
        },
        chalk: '#F5F5F5', // main text
        muted: '#9AA0A6', // secondary text
        line: '#272C31', // border
        danger: '#FF4545', // danger / warning

        // ===== Semantic tokens (compat) =====
        background: '#0B0D0F',
        foreground: '#F5F5F5',
        border: '#272C31',
        input: '#272C31',
        ring: '#B7FF00',
        card: {
          DEFAULT: '#15191D',
          foreground: '#F5F5F5',
        },
        popover: {
          DEFAULT: '#15191D',
          foreground: '#F5F5F5',
        },
        primary: {
          DEFAULT: '#B7FF00',
          foreground: '#0B0D0F',
        },
        secondary: {
          DEFAULT: '#15191D',
          foreground: '#F5F5F5',
        },
        accent: {
          DEFAULT: '#15191D',
          foreground: '#F5F5F5',
        },
        destructive: {
          DEFAULT: '#FF4545',
          foreground: '#F5F5F5',
        },
        'muted-foreground': '#9AA0A6',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
      },
      borderRadius: {
        lg: '14px',
        md: '12px',
        sm: '10px',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
export default config;

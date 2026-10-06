import type { Config } from 'tailwindcss';

/**
 * Màu theo CSS variables để đổi theme sáng/tối không cần sửa component.
 * `:root` = light, `.dark` = dark (định nghĩa trong globals.css).
 * Cú pháp `rgb(var(--x) / <alpha-value>)` giữ nguyên opacity modifier (/10, /40...).
 */
const tv = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

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
        // ===== Brand palette (chuyển sáng/tối qua CSS variables) =====
        ink: tv('--ink'), // background
        surface: tv('--surface'), // secondary background / card
        neon: {
          DEFAULT: tv('--neon'), // primary accent
          hover: tv('--neon-hover'), // primary hover
        },
        chalk: tv('--chalk'), // main text
        muted: tv('--muted'), // secondary text
        line: tv('--line'), // border
        danger: tv('--danger'), // danger / warning

        // ===== Semantic tokens (compat) =====
        background: tv('--ink'),
        foreground: tv('--chalk'),
        border: tv('--line'),
        input: tv('--line'),
        ring: tv('--neon'),
        card: {
          DEFAULT: tv('--surface'),
          foreground: tv('--chalk'),
        },
        popover: {
          DEFAULT: tv('--surface'),
          foreground: tv('--chalk'),
        },
        primary: {
          DEFAULT: tv('--neon'),
          foreground: tv('--on-neon'),
        },
        secondary: {
          DEFAULT: tv('--surface'),
          foreground: tv('--chalk'),
        },
        accent: {
          DEFAULT: tv('--surface'),
          foreground: tv('--chalk'),
        },
        destructive: {
          DEFAULT: tv('--danger'),
          foreground: tv('--chalk'),
        },
        'muted-foreground': tv('--muted'),
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

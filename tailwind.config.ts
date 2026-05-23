import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx,md}',
    './components/**/*.{ts,tsx}',
    './content/**/*.{mdx,md}',
    './data/**/*.mdx',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Source Serif 4"', '"Source Serif Pro"', 'Charter', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        ink: '#1a1a1a',
        paper: '#fafaf7',
        muted: '#6b6b66',
        rule: '#e6e4dc',
        accent: '#7a3b2e',
      },
      maxWidth: {
        prose: '68ch',
        page: '72rem',
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#1a1a1a',
            maxWidth: '68ch',
          },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;

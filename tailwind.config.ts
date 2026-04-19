import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF3FD',
          100: '#DDE7FB',
          200: '#BAC8F7',
          300: '#8BA8F0',
          400: '#5A83E6',
          500: '#3462DC',
          600: '#1F4FD9',
          700: '#1940B0',
          800: '#16389F',
          900: '#112E88',
        },
        ok: {
          DEFAULT: '#0E8A5F',
          soft: '#E7F5EE',
        },
        warn: {
          DEFAULT: '#A65A06',
          soft: '#FBF1E2',
        },
        danger: {
          DEFAULT: '#B42318',
          soft: '#FBECEA',
        },
        violet: {
          DEFAULT: '#5B3DC9',
          soft: '#EEEAFB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config

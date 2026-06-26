import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'ws-orange': '#D85A30',
        'ws-orange-light': '#FAECE7',
        'ws-orange-dark': '#993C1D',
        'ws-teal': '#1D9E75',
        'ws-teal-light': '#E1F5EE',
        'ws-teal-dark': '#085041',
        'ws-purple': '#7F77DD',
        'ws-purple-light': '#EEEDFE',
        'ws-purple-dark': '#3C3489',
        'ws-amber': '#BA7517',
        'ws-amber-light': '#FAEEDA',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config

import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1A5276',
        secondary: '#F1C40F',
        dark: '#1A1A2E',
      }
    }
  },
  plugins: []
};
export default config;

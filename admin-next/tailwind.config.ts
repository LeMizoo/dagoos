import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: '#06245F',
        secondary: '#E0A01C',
        dark: '#06245F',
      }
    }
  },
  plugins: []
};
export default config;

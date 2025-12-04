import type { Config } from 'tailwindcss';

const baseConfig = require('../../packages/config/tailwind.config.js');

export default {
  ...baseConfig,
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
} satisfies Config;


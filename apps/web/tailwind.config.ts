import type { Config } from 'tailwindcss';
import { kodiraUiPreset } from '../../packages/ui/tailwind.preset';

const config: Config = {
  ...kodiraUiPreset,
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: kodiraUiPreset.theme,
  plugins: [],
};
export default config;

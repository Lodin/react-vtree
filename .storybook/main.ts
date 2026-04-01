import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  addons: [],
  framework: '@storybook/react-vite',
  stories: ['../__stories__/**/*.story.tsx'],
};

export default config;

import { defineConfig, type UserConfig } from 'tsdown';

const config: UserConfig = defineConfig({
  clean: true,
  deps: {
    neverBundle: ['react', 'react-dom', 'react-window', 'react-merge-refs'],
  },
  dts: true,
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  sourcemap: true,
  unbundle: true,
});

export default config;

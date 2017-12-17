const path = require('path');

const resolve = way => path.resolve(process.cwd(), way);
const config = way => resolve(`config/jest/${way}`);

module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
  globals: {
    'ts-jest': {
      tsConfigFile: resolve('tsconfig.test.json'),
    },
  },
  mapCoverage: true,
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
  },
  moduleFileExtensions: [
    'web.ts',
    'ts',
    'web.tsx',
    'tsx',
    'web.js',
    'js',
    'web.jsx',
    'jsx',
    'json',
    'node',
  ],
  rootDir: process.cwd(),
  setupFiles: [
    config('polyfills.js'),
  ],
  setupTestFrameworkScriptFile: config('enzyme.js'),
  testMatch: [
    resolve('src/**/__tests__/**/*.ts?(x)'),
    resolve('src/**/?(*.)(spec|test).ts?(x)'),
  ],
  testEnvironment: 'jsdom',
  testURL: 'http://localhost',
  transform: {
    '^.+\\.css$': config('cssTransform.js'),
    '^.+\\.tsx?$': config('typescriptTransform.js'),
    '^(?!.*\\.(js|jsx|css|json)$)': config('fileTransform.js'),
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$',
  ],
};

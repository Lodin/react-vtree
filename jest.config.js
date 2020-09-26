module.exports = {
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  setupFilesAfterEnv: ['./config/enzyme.js'],
  testMatch: ['<rootDir>/__tests__/**/*.spec.tsx'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  verbose: true,
};

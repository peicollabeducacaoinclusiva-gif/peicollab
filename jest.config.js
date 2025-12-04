module.exports = {
  preset: 'jest-environment-node',
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'apps/**/*.{ts,tsx}',
    'packages/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  moduleNameMapper: {
    '^@pei/(.*)$': '<rootDir>/packages/$1/src',
  },
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};


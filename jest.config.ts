import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/server/__tests__/**/*.test.ts'],
  setupFiles: ['<rootDir>/src/server/__tests__/setup.ts'],
  clearMocks: true,
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', 'src/server/__tests__/', 'src/server/app.ts', 'src/server/config/'],
};

export default config;

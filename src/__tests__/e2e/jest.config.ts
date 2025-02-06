import type { Config } from '@jest/types';
import { defaults } from 'jest-config';

const config: Config.InitialOptions = {
  displayName: 'e2e',
  testMatch: ['<rootDir>/**/*.spec.ts'],
  testEnvironment: 'node',
  clearMocks: true,
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts'],
  roots: ['<rootDir>'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  setupFilesAfterEnv: ['../setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../$1',
    '^src/(.*)$': '<rootDir>/../$1',
  },
  coverageDirectory: '../../../coverage/e2e',
  collectCoverageFrom: [
    '**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.d.ts',
  ],
  testTimeout: 60000,
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
};

export default config;

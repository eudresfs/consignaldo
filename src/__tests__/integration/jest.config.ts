import type { Config } from '@jest/types';
import { defaults } from 'jest-config';

const config: Config.InitialOptions = {
  displayName: 'integration',
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
  coverageDirectory: '../../../coverage/integration',
  collectCoverageFrom: [
    '**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.d.ts',
  ],
  testTimeout: 30000,
};

export default config;

import type { Config } from '@jest/types';
import { defaults } from 'jest-config';

const config: Config.InitialOptions = {
  displayName: 'unit',
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
  coverageDirectory: '../../../coverage/unit',
  collectCoverageFrom: [
    '**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.d.ts',
  ],
};

export default config;

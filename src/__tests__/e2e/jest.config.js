"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jest_config_1 = require("jest-config");
const config = {
    displayName: 'e2e',
    testMatch: ['<rootDir>/**/*.spec.ts'],
    testEnvironment: 'node',
    clearMocks: true,
    moduleFileExtensions: [...jest_config_1.defaults.moduleFileExtensions, 'ts'],
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
exports.default = config;

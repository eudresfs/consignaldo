"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jest_config_1 = require("jest-config");
const config = {
    displayName: 'integration',
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
    coverageDirectory: '../../../coverage/integration',
    collectCoverageFrom: [
        '**/*.ts',
        '!**/node_modules/**',
        '!**/dist/**',
        '!**/*.d.ts',
    ],
    testTimeout: 30000,
};
exports.default = config;

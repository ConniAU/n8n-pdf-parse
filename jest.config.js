/**
 * @file jest.config.js
 * @description Jest configuration for N8N PDF Parse node testing
 * @author AI Assistant
 * @date 2025-09-10
 * @modified 2025-09-10
 */

module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>'],
	testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
	transform: {
		'^.+\\.ts$': 'ts-jest',
	},
	collectCoverageFrom: [
		'nodes/**/*.ts',
		'!nodes/**/*.d.ts',
		'!**/node_modules/**',
	],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html'],
};
/**
 * @file .eslintrc.js
 * @description ESLint configuration for N8N PDF Parse node
 * @author AI Assistant
 * @date 2025-09-10
 * @modified 2025-09-10
 */

module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		project: './tsconfig.json',
	},
	plugins: ['@typescript-eslint', 'n8n-nodes-base'],
	extends: [
		'eslint:recommended',
		'@typescript-eslint/recommended',
		'plugin:n8n-nodes-base/nodes',
	],
	rules: {
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/no-explicit-any': 'warn',
		'@typescript-eslint/no-non-null-assertion': 'off',
		'prefer-const': 'error',
		'no-var': 'error',
		'no-console': 'warn',
	},
	env: {
		node: true,
		es6: true,
	},
	ignorePatterns: ['dist/', 'node_modules/', '*.js'],
};
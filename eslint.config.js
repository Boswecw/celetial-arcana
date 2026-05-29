// Flat config (ESLint 9). Focused on bug-class rules: unused vars,
// undeclared globals, accidental `any` propagation. Style is handled by
// Prettier; type correctness is handled by svelte-check. ESLint covers the
// gap between the two.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

export default [
	{
		ignores: [
			'.svelte-kit/**',
			'build/**',
			'node_modules/**',
			'static/**',
			'python_packages/**',
			'.data/**',
			'readings/**',
			'**/*.cjs',
			'eslint.config.js'
		]
	},

	js.configs.recommended,
	...tseslint.configs.recommended,
	...sveltePlugin.configs['flat/recommended'],

	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},

	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tseslint.parser
			}
		}
	},

	{
		// Service worker has its own globals (self, caches, fetch event types).
		files: ['static/sw.js'],
		languageOptions: {
			globals: {
				...globals.serviceworker
			}
		}
	},

	{
		rules: {
			// Catch real bugs but stay tolerant of in-progress code. Tighten later
			// once the codebase has been swept once.
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			],
			'@typescript-eslint/no-explicit-any': 'off',
			'no-empty': ['warn', { allowEmptyCatch: true }],
			'no-useless-escape': 'warn',
			'no-useless-assignment': 'warn',
			'no-constant-condition': ['error', { checkLoops: false }],
			'svelte/no-at-html-tags': 'warn',

			// Demoted to off — these are SvelteKit 2 / Svelte 5 best-practice
			// nudges, not bug-class rules. Worth revisiting as a separate
			// project, but blocking PRs on them now would generate noise without
			// meaningful safety.
			'svelte/no-navigation-without-resolve': 'off',
			'svelte/prefer-svelte-reactivity': 'off'
		}
	}
];

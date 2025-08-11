import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['dist/**', 'node_modules/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        // project: './tsconfig.json', // Removed to avoid Vite config error
      },
      ecmaVersion: 2021,
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        alert: 'readonly',
        prompt: 'readonly',
        performance: 'readonly',
        MessageChannel: 'readonly',
        AbortController: 'readonly',
        FormData: 'readonly',
        queueMicrotask: 'readonly',
        MutationObserver: 'readonly',
        matchMedia: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react,
    },
    rules: {
      // Add your custom rules here
    },
  },
]; 
import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import ts from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { '@next/next': nextPlugin },
    rules: nextPlugin.configs.recommended.rules,
  },
  {
    files: ['app/**/*.tsx', 'components/**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
];

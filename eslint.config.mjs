/* eslint-disable import-x/no-named-as-default-member */
import stylistic from '@stylistic/eslint-plugin';
import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tsEslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import-x';
import globals from 'globals';

export default defineConfig(
  globalIgnores(['dist/**', 'node_modules/**', 'coverage/**', 'build/**']),
  eslint.configs.recommended,
  tsEslint.configs.strict,
  tsEslint.configs.stylistic,
  stylistic.configs.customize({
    semi: true,
    jsx: false,
  }),
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    files: ['**/*.ts', '**/*.js', '**/*.mjs'],
    languageOptions: {
      parser: tsEslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['./*', '../*'],
          message: 'Relative imports are not allowed, use absolute imports instead.',
        }],
      }],
    },
  },
  {
    files: ['scripts/**/*.ts', 'scripts/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);

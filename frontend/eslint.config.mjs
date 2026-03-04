/** Frontend ESLint flat configuration and rule wiring for Vue and JavaScript sources. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [
  {
    ignores: ['node_modules/**', 'dist/**', '.tmp-build-audit/**']
  },
  ...compat.config({
    env: {
      browser: true,
      node: true,
      es2022: true
    },
    extends: ['eslint:recommended', 'plugin:vue/vue3-essential', 'prettier'],
    parser: 'vue-eslint-parser',
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  })
];


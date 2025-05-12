import eslint from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import perfectionist from 'eslint-plugin-perfectionist';
import security from 'eslint-plugin-security';
import unicorn from 'eslint-plugin-unicorn';
import tsEslint from 'typescript-eslint';

/**
 * @type {import('./node_modules/typescript-eslint/dist/config-helper').InfiniteDepthConfigWithExtends}
 */
const options = {
  languageOptions: {
    globals: {
      console: true,
      process: true,
      require: true,
    },
    parserOptions: {
      warnOnUnsupportedTypeScriptVersion: false,
    },
  },
};

/**
 * @type {import('./node_modules/typescript-eslint/dist/config-helper').InfiniteDepthConfigWithExtends}
 */
const ignore = {
  ignores: ['**/build/**', '**/coverage/**', '**/node_modules/**', '**/dist/**'],
};

/**
 * @type {import('./node_modules/typescript-eslint/dist/config-helper').InfiniteDepthConfigWithExtends}
 */
const typescriptSource = {
  files: ['**/src/**/*.ts', '**/test/**/*.test.ts'],
  extends: [
    eslint.configs.recommended,
    tsEslint.configs.strict,
    tsEslint.configs.stylistic,
    tsEslint.configs.eslintRecommended,
    jsdoc.configs['flat/recommended-typescript-flavor-error'],
    unicorn.configs['flat/recommended'],
    perfectionist.configs['recommended-natural'],
    security.configs.recommended,
  ],
  rules: {
    'jsdoc/require-param-type': ['off'],
    'jsdoc/require-returns-type': ['off'],
    'jsdoc/require-jsdoc': [
      'error',
      {
        require: {
          ClassDeclaration: true,
          FunctionDeclaration: true,
          MethodDefinition: true,
        },
      },
    ],
  },
};

export default tsEslint.config(options, ignore, typescriptSource);

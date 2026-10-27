import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import noPhysicalDirection from './eslint-rules/no-physical-direction.js'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dist-prod',
      'lighthouse-report',
      'design_handoff_caretex_family_app',
      'public/mockServiceWorker.js',
      'src/routeTree.gen.ts',
      'playwright-report',
      'test-results',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2023, globals: globals.browser },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      caretex: { rules: { 'no-physical-direction': noPhysicalDirection } },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      'caretex/no-physical-direction': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/mocks/fixtures/*', '**/mocks/fixtures/*'],
              message: 'Components must load data through src/api, never fixtures.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/mocks/**', 'src/test/**', '**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node } },
  },
  {
    files: ['pwa/sw.js'],
    languageOptions: { sourceType: 'script', globals: { ...globals.serviceworker } },
  },
)

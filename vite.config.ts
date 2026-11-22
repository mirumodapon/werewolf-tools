import { defineConfig } from 'vite-plus'

/** Lint, format and test settings for the whole workspace. Packages add only a `test` block. */
export default defineConfig({
  lint: {
    ignorePatterns: [
      '**/dist/**',
      '**/dev-dist/**',
      '**/node_modules/**',
      '**/.vitepress/cache/**',
    ],
    plugins: ['typescript', 'unicorn', 'oxc', 'vue', 'import', 'vitest'],
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'typescript/consistent-type-imports': 'error',
      'import/no-cycle': 'error',
    },
    overrides: [
      { files: ['scripts/**', 'packages/pwa/scripts/**'], rules: { 'no-console': 'off' } },
    ],
  },
  fmt: {
    ignorePatterns: [
      '**/dist/**',
      '**/dev-dist/**',
      '**/.vitepress/cache/**',
      'pnpm-lock.yaml',
      'CHANGELOG.md',
    ],
    semi: false,
    singleQuote: true,
    printWidth: 100,
  },
  test: {
    projects: ['packages/*', 'apps/*'],
  },
})

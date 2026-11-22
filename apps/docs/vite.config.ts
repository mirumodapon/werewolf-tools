import { defineConfig } from 'vite-plus'

export default defineConfig({
  test: { name: 'docs', include: ['.vitepress/**/*.test.ts'] },
})

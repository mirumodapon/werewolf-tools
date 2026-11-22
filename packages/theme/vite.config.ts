import { defineConfig } from 'vite-plus'

export default defineConfig({
  test: { name: 'theme', environment: 'jsdom' },
})

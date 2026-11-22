import { defineConfig } from 'vite-plus'

export default defineConfig({
  test: { name: 'i18n', environment: 'jsdom' },
})

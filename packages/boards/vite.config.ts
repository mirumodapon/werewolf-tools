import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

export default defineConfig({
  plugins: [vue()],
  test: {
    name: 'boards',
    environment: 'jsdom',
    alias: {
      'virtual:pwa-register/vue': fileURLToPath(
        import.meta.resolve('@werewolf/ui/test/pwa-register-mock'),
      ),
    },
  },
})

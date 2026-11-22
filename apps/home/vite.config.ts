import vue from '@vitejs/plugin-vue'
import { thirdPartyLicensesPlugin } from '@werewolf/licenses'
import { buildVersion, werewolfPwa } from '@werewolf/pwa'
import { manifestName, toolById } from '@werewolf/registry'
import { werewolfUnoConfig } from '@werewolf/theme/uno'
import { tokyoNightThemePlugin } from '@werewolf/theme/vite'
import { fileURLToPath } from 'node:url'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite-plus'

const TOOL = toolById('home')

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(buildVersion()) },
  base: TOOL.path,
  plugins: [
    tokyoNightThemePlugin(),
    vue(),
    UnoCSS(werewolfUnoConfig()),
    werewolfPwa(TOOL),
    thirdPartyLicensesPlugin(manifestName(TOOL)),
  ],
  test: {
    name: 'home',
    environment: 'jsdom',
    alias: {
      'virtual:pwa-register/vue': fileURLToPath(
        import.meta.resolve('@werewolf/ui/test/pwa-register-mock'),
      ),
    },
  },
})

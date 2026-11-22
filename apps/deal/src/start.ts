import { startAt } from '@werewolf/share'
import { installWerewolf } from '@werewolf/ui'
import { createApp } from 'vue'
import App from './App.vue'
import { messages } from './locales/index.ts'
import { createDealRouter, sharedBoardRoute } from './router.ts'

/** Starts the app on `el`, opening the import preview when a board link (`?b=`) asks for it. */
export function startDeal(el: string | Element = '#app') {
  const app = createApp(App)
  installWerewolf(app, 'deal', messages)
  // Before the router exists: it starts on whatever the address says.
  const shared = sharedBoardRoute()
  if (shared) startAt(shared)
  const router = createDealRouter()
  app.use(router)
  app.mount(el)
  return { app, router }
}

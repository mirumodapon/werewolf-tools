import { startAt } from '@werewolf/share'
import { installWerewolf } from '@werewolf/ui'
import { createApp } from 'vue'
import App from './App.vue'
import { messages } from './locales/index.ts'
import { createJudgeRouter, incomingRoute } from './router.ts'

/** Starts the app on `el`, opening the page a shared link asks for (`?s=`, `?t=`, `?b=`). */
export async function startJudge(el: string | Element = '#app') {
  const app = createApp(App)
  installWerewolf(app, 'judge', messages)
  // Before the router exists: it starts on whatever the address says.
  const incoming = await incomingRoute()
  if (incoming) startAt(incoming)
  const router = createJudgeRouter()
  app.use(router)
  app.mount(el)
  return { app, router }
}

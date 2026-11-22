import { requestPersistentStorage } from '@werewolf/storage'
import { installWerewolf } from '@werewolf/ui'
import 'virtual:uno.css'
import { createApp } from 'vue'
import App from './App.vue'
import { messages } from './locales/index.ts'
import { createJudgeRouter, incomingRoute } from './router.ts'

const app = createApp(App)
installWerewolf(app, 'judge', messages)
const router = createJudgeRouter()
const incoming = await incomingRoute()
if (incoming) void router.replace(incoming)
app.use(router)
app.mount('#app')
void requestPersistentStorage()

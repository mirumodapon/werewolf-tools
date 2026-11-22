import { requestPersistentStorage } from '@werewolf/storage'
import { installWerewolf } from '@werewolf/ui'
import 'virtual:uno.css'
import { createApp } from 'vue'
import App from './App.vue'
import { messages } from './locales/index.ts'
import { createDealRouter, sharedBoardRoute } from './router.ts'

const app = createApp(App)
installWerewolf(app, 'deal', messages)
const router = createDealRouter()
const shared = sharedBoardRoute()
if (shared) void router.replace(shared)
app.use(router)
app.mount('#app')
void requestPersistentStorage()

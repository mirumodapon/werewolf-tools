import { installWerewolf } from '@werewolf/ui'
import 'virtual:uno.css'
import { createApp } from 'vue'
import App from './App.vue'
import { messages } from './locales/index.ts'
import { createHomeRouter } from './router.ts'

const app = createApp(App)
installWerewolf(app, 'home', messages)
app.use(createHomeRouter())
app.mount('#app')

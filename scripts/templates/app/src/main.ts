import { installWerewolf } from '@werewolf/ui'
import 'virtual:uno.css'
import { createApp } from 'vue'
import App from './App.vue'
import { messages } from './locales/index.ts'

const app = createApp(App)
installWerewolf(app, '__ID__', messages)
app.mount('#app')

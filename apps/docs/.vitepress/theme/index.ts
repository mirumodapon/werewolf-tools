import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'
import BuiltinBoards from './BuiltinBoards.vue'
import RoleTable from './RoleTable.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('BuiltinBoards', BuiltinBoards)
    app.component('RoleTable', RoleTable)
  },
} satisfies Theme

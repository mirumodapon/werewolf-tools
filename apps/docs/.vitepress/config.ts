import { thirdPartyLicensesPlugin } from '@werewolf/licenses'
import { manifestName, toolById } from '@werewolf/registry'
import { THEME_KEY } from '@werewolf/theme'
import { defineConfig, type DefaultTheme } from 'vitepress'

const DOCS = toolById('docs')

const sidebar: DefaultTheme.Sidebar = [
  {
    text: '使用說明',
    items: [
      { text: '開始使用', link: '/guide/getting-started' },
      { text: '角色發牌', link: '/guide/deal' },
      { text: '法官輔助', link: '/guide/judge' },
      { text: '板子與自訂板子', link: '/guide/boards' },
      { text: '常見問題', link: '/guide/faq' },
    ],
  },
  {
    text: '遊戲規則',
    items: [
      { text: '遊戲流程與名詞', link: '/rules/basics' },
      { text: '角色', link: '/rules/roles' },
      { text: '夜晚順序與台詞', link: '/rules/night-order' },
      { text: '白天與勝負', link: '/rules/day' },
      { text: '板子設定', link: '/rules/board-settings' },
      { text: '內建板子', link: '/rules/builtin-boards' },
    ],
  },
  {
    text: '開發者',
    items: [
      { text: '架構與指令', link: '/dev/architecture' },
      { text: '新增角色、板子、翻譯', link: '/dev/extending' },
      { text: '「未驗證」標記', link: '/dev/verification' },
      { text: '資料與儲存', link: '/dev/data' },
    ],
  },
  { text: '更新紀錄', link: '/changelog' },
]

/**
 * VitePress keeps its own light/dark choice; on first load it follows the tools' shared
 * theme (`werewolf:global:theme`) so the docs open in the same colors.
 */
const appearanceScript = `try{if(!localStorage.getItem('vitepress-theme-appearance')){var t=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_KEY)})||'null');var m=t&&t.data&&t.data.mode;if(m==='light')localStorage.setItem('vitepress-theme-appearance','light');else if(m==='night'||m==='storm')localStorage.setItem('vitepress-theme-appearance','dark')}}catch(e){}`

export default defineConfig({
  // Served at /docs/ next to the tools.
  base: DOCS.path,
  outDir: './dist',
  // GitHub Pages serves /docs/guide/deal.html for /docs/guide/deal.
  cleanUrls: true,
  lang: 'zh-Hant-TW',
  title: '狼人殺工具集使用說明',
  description: DOCS.description['zh-TW'],
  head: [
    ['script', {}, appearanceScript],
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],
  themeConfig: {
    nav: [
      { text: '使用說明', link: '/guide/getting-started' },
      { text: '遊戲規則', link: '/rules/basics' },
      { text: '開發者', link: '/dev/architecture' },
      { text: '更新紀錄', link: '/changelog' },
      { text: '回到工具集', link: 'https://werewolf.mirumo.net/', target: '_self' },
    ],
    sidebar,
    outline: { label: '本頁內容', level: [2, 3] },
    docFooter: { prev: '上一頁', next: '下一頁' },
    darkModeSwitchLabel: '外觀',
    sidebarMenuLabel: '選單',
    returnToTopLabel: '回到頂端',
    search: { provider: 'local' },
    footer: { message: 'MIT 授權・本站與「狼人殺」相關商標及出版商無關。' },
  },
  vite: {
    plugins: [thirdPartyLicensesPlugin(manifestName(DOCS))],
  },
})

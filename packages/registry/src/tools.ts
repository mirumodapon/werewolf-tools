import type { ToolMeta } from './types.ts'

/**
 * Every tool, in home-page order. Home, the build, PWA manifests and service workers, the
 * dev proxy and icon generation all read this list. `pnpm new:app` appends to it.
 */
export const TOOLS = [
  {
    id: 'home',
    kind: 'pwa',
    name: { 'zh-TW': '狼人殺工具集', 'en-US': 'Werewolf Tools' },
    shortName: { 'zh-TW': '狼人殺', 'en-US': 'Werewolf' },
    description: {
      'zh-TW': '狼人殺桌遊的輔助工具',
      'en-US': 'Helpers for the Werewolf party game',
    },
    path: '/',
    icon: 'moon-stars',
    accent: 'purple',
    status: 'stable',
  },
  {
    id: 'deal',
    kind: 'pwa',
    name: { 'zh-TW': '角色發牌', 'en-US': 'Role Deal' },
    shortName: { 'zh-TW': '角色發牌', 'en-US': 'Role Deal' },
    description: {
      'zh-TW': '一支手機輪流傳，讓每位玩家查看自己的角色',
      'en-US': 'Pass one phone around so every player sees their own role',
    },
    path: '/deal/',
    icon: 'cards',
    accent: 'red',
    status: 'alpha',
  },
  {
    id: 'judge',
    kind: 'pwa',
    name: { 'zh-TW': '法官輔助', 'en-US': 'Moderator Assistant' },
    shortName: { 'zh-TW': '法官輔助', 'en-US': 'Moderator' },
    description: {
      'zh-TW': '依遊戲進度提示台詞與夜晚行動，算出死訊並保存紀錄',
      'en-US': 'Prompts each announcement and night action, works out deaths and keeps records',
    },
    path: '/judge/',
    icon: 'gavel',
    accent: 'blue',
    status: 'alpha',
  },
  {
    id: 'docs',
    kind: 'docs',
    name: { 'zh-TW': '使用說明', 'en-US': 'Guide' },
    shortName: { 'zh-TW': '使用說明', 'en-US': 'Guide' },
    description: {
      'zh-TW': '工具使用方式、遊戲規則與板子設定',
      'en-US': 'How to use the tools, game rules and board settings',
    },
    path: '/docs/',
    icon: 'book',
    accent: 'teal',
    status: 'stable',
  },
  // new:app inserts here
] as const satisfies readonly ToolMeta[]

export type ToolId = (typeof TOOLS)[number]['id']

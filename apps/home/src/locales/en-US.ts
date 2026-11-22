import type { Shape } from '@werewolf/i18n'
import type zhTW from './zh-TW.ts'

export default {
  home: {
    title: 'Werewolf Tools',
    tools: 'Tools',
    open: 'Open',
    disclaimer: 'This site is not affiliated with any Werewolf trademark holder or publisher.',
  },
  info: {
    title: 'About',
    version: 'Version',
    storage: 'Storage',
    licenses: 'Licenses',
    licensesIntro:
      'Werewolf Tools is MIT licensed. Third-party packages each tool uses, and their licenses:',
    changelog: 'Changelog',
    fullChangelog: 'Full changelog',
    docs: 'Guide',
  },
} satisfies Shape<typeof zhTW>

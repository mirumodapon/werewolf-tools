import { mount } from '@vue/test-utils'
import { installWerewolf } from '@werewolf/ui'
import { describe, expect, it } from 'vite-plus/test'
import App from './App.vue'
import { messages } from './locales/index.ts'

describe('App', () => {
  it('renders its title', () => {
    const w = mount(App, {
      global: { plugins: [{ install: (app) => installWerewolf(app, '__ID__', messages) }] },
    })
    expect(w.text()).toContain('__NAME__')
  })
})

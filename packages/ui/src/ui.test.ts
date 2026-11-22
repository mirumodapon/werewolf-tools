import { mount, type ComponentMountingOptions } from '@vue/test-utils'
import { createWerewolfI18n } from '@werewolf/i18n'
import { toolById } from '@werewolf/registry'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vite-plus/test'
import { defineComponent, h, nextTick, ref } from 'vue'
import AppShell from './AppShell.vue'
import { useConfirm } from './confirmStore.ts'
import ConfirmHost from './ConfirmHost.vue'
import { LAUNCHER_KEY, launchedFromHome, markLaunchedFromHome } from './launcher.ts'
import SeatPicker from './SeatPicker.vue'
import { TOOL_KEY } from './setup.ts'
import Stepper from './Stepper.vue'
import { needRefresh, updateCalls } from './test/pwa-register-mock.ts'
import UpdateGate from './UpdateGate.vue'

function options(tool = 'deal'): Pick<ComponentMountingOptions<unknown>, 'global'> {
  const pinia = createPinia()
  setActivePinia(pinia)
  return {
    global: {
      plugins: [pinia, createWerewolfI18n(undefined, 'zh-TW')],
      provide: { [TOOL_KEY as symbol]: toolById(tool) },
    },
  }
}

describe('AppShell', () => {
  beforeEach(() => sessionStorage.clear())

  it('shows the tool status on its top page', () => {
    const w = mount(AppShell, { ...options(), props: { title: '角色發牌' } })
    expect(w.find('[data-testid="status-alpha"]').text()).toBe('alpha')
    expect(w.find('[data-testid="home-link"]').exists()).toBe(false)
  })

  it('links the title home when opened from the home app', () => {
    markLaunchedFromHome()
    expect(launchedFromHome()).toBe(true)
    const w = mount(AppShell, { ...options(), props: { title: '角色發牌' } })
    expect(w.find('[data-testid="home-link"]').attributes('href')).toBe('/')
    const sub = mount(AppShell, { ...options(), props: { title: '歷史', backLabel: '返回' } })
    expect(sub.find('[data-testid="home-link"]').exists()).toBe(false)
    sessionStorage.removeItem(LAUNCHER_KEY)
  })

  it('never links home on home itself', () => {
    markLaunchedFromHome()
    const w = mount(AppShell, { ...options('home'), props: { title: '狼人殺工具集' } })
    expect(w.find('[data-testid="home-link"]').exists()).toBe(false)
  })
})

describe('controls', () => {
  it('Stepper clamps to its range', async () => {
    const value = ref(1)
    const w = mount(Stepper, {
      ...options(),
      props: {
        label: 'n',
        min: 1,
        max: 2,
        modelValue: value.value,
        'onUpdate:modelValue': (v: number) => (value.value = v),
      },
    })
    await w.findAll('button')[1]!.trigger('click')
    expect(value.value).toBe(2)
  })

  it('SeatPicker picks one or several seats', async () => {
    let one: number | null = null
    const w = mount(SeatPicker, {
      ...options(),
      props: {
        count: 5,
        label: 's',
        modelValue: one,
        dead: [2],
        'onUpdate:modelValue': (v: unknown) => (one = v as number),
      },
    })
    await w.find('[data-testid="seat-3"]').trigger('click')
    expect(one).toBe(3)
    expect(w.find('[data-testid="seat-2"]').attributes('disabled')).toBeDefined()
    let many: number[] = [4]
    const m = mount(SeatPicker, {
      ...options(),
      props: {
        count: 5,
        label: 's',
        multiple: true,
        max: 2,
        modelValue: many,
        'onUpdate:modelValue': (v: unknown) => (many = v as number[]),
      },
    })
    await m.find('[data-testid="seat-1"]').trigger('click')
    expect(many).toEqual([1, 4])
  })

  it('useConfirm resolves with the answer', async () => {
    const opts = options()
    let ask!: ReturnType<typeof useConfirm>
    const Host = defineComponent(() => {
      ask = useConfirm()
      return () => h(ConfirmHost)
    })
    const w = mount(Host, opts)
    const answer = ask({ message: '刪除？' })
    await nextTick()
    expect(w.find('[data-testid="confirm-message"]').text()).toBe('刪除？')
    await w.find('[data-testid="confirm-ok"]').trigger('click')
    expect(await answer).toBe(true)
  })
})

describe('UpdateGate', () => {
  it('applies a found update at once', async () => {
    const w = mount(UpdateGate, {
      ...options(),
      props: { enabled: false },
      slots: { default: () => 'app' },
    })
    expect(w.find('[data-testid="update-gate"]').exists()).toBe(false)
    needRefresh.value = true
    await nextTick()
    expect(w.find('[data-testid="update-gate"]').text()).toContain('更新中')
    expect(updateCalls).toEqual([true])
  })
})

describe('noZoom', () => {
  it('cancels the second touch of a double tap and pinch gestures', async () => {
    const { noZoom } = await import('./noZoom.ts')
    const off = noZoom()
    const touchEnd = (timeStamp: number) => {
      const e = new Event('touchend', { cancelable: true })
      Object.defineProperty(e, 'timeStamp', { value: timeStamp })
      document.dispatchEvent(e)
      return e.defaultPrevented
    }
    expect(touchEnd(1000)).toBe(false)
    expect(touchEnd(1200)).toBe(true)
    expect(touchEnd(3000)).toBe(false)
    const gesture = new Event('gesturestart', { cancelable: true })
    document.dispatchEvent(gesture)
    expect(gesture.defaultPrevented).toBe(true)
    off()
    const after = new Event('gesturestart', { cancelable: true })
    document.dispatchEvent(after)
    expect(after.defaultPrevented).toBe(false)
  })
})

import { mount, type ComponentMountingOptions } from '@vue/test-utils'
import { createWerewolfI18n } from '@werewolf/i18n'
import { toolById } from '@werewolf/registry'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
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
  const touchEnd = (target: EventTarget, timeStamp: number) => {
    const e = new Event('touchend', { cancelable: true, bubbles: true })
    Object.defineProperty(e, 'timeStamp', { value: timeStamp })
    target.dispatchEvent(e)
    return e.defaultPrevented
  }

  it('blocks the zoom of a quick second tap but still clicks what was tapped', async () => {
    const { noZoom } = await import('./noZoom.ts')
    const off = noZoom()
    const a = document.createElement('button')
    const b = document.createElement('button')
    const clicks: string[] = []
    a.addEventListener('click', () => clicks.push('a'))
    b.addEventListener('click', () => clicks.push('b'))
    document.body.append(a, b)
    expect(touchEnd(a, 1000)).toBe(false)
    // A fast tap on another button: zoom cancelled, the button still clicked.
    expect(touchEnd(b, 1200)).toBe(true)
    expect(clicks).toEqual(['b'])
    expect(touchEnd(a, 3000)).toBe(false)
    off()
    a.remove()
    b.remove()
  })

  it('leaves text fields alone and cancels pinch gestures', async () => {
    const { noZoom } = await import('./noZoom.ts')
    const off = noZoom()
    const input = document.createElement('input')
    document.body.append(input)
    touchEnd(input, 1000)
    expect(touchEnd(input, 1100)).toBe(false)
    const gesture = new Event('gesturestart', { cancelable: true })
    document.dispatchEvent(gesture)
    expect(gesture.defaultPrevented).toBe(true)
    off()
    const after = new Event('gesturestart', { cancelable: true })
    document.dispatchEvent(after)
    expect(after.defaultPrevented).toBe(false)
    input.remove()
  })
})

describe('checkForUpdate', () => {
  const nav = (registration: Partial<ServiceWorkerRegistration> | undefined, onLine = true) =>
    ({
      onLine,
      serviceWorker: { getRegistration: async () => registration },
    }) as unknown as Navigator

  it('reports a new version once the worker updates into one', async () => {
    const { checkForUpdate } = await import('./update.ts')
    const r: Partial<ServiceWorkerRegistration> = { waiting: null, installing: null }
    r.update = async () => {
      Object.assign(r, { installing: {} })
      return r as ServiceWorkerRegistration
    }
    expect(await checkForUpdate(nav(r))).toBe('found')
  })

  it('says latest when nothing new arrives, unavailable offline or without a worker', async () => {
    const { checkForUpdate } = await import('./update.ts')
    const r = { waiting: null, installing: null, update: async () => r } as never
    expect(await checkForUpdate(nav(r))).toBe('latest')
    expect(await checkForUpdate(nav(r, false))).toBe('unavailable')
    expect(await checkForUpdate(nav(undefined))).toBe('unavailable')
    expect(await checkForUpdate({} as Navigator)).toBe('unavailable')
  })
})

describe('CheckUpdate', () => {
  it('shows the result of the check', async () => {
    const { default: CheckUpdate } = await import('./CheckUpdate.vue')
    const w = mount(CheckUpdate, { ...options(), props: { check: async () => 'latest' as const } })
    expect(w.find('[data-testid="check-update"]').text()).toBe('檢查更新')
    await w.find('[data-testid="check-update"]').trigger('click')
    await nextTick()
    await nextTick()
    expect(w.find('[data-testid="update-result"]').text()).toBe('已是最新版本')
  })
})

describe('SeatPicker with a "nobody" button', () => {
  // A real parent owning both models, as the moderator's step panel does.
  const Parent = defineComponent(() => {
    const seat = ref<number | null>(null)
    const none = ref(false)
    return () =>
      h('div', [
        h(SeatPicker, {
          count: 5,
          label: 's',
          noneLabel: '空刀',
          modelValue: seat.value,
          'onUpdate:modelValue': (v: unknown) => (seat.value = v as number | null),
          none: none.value,
          'onUpdate:none': (v: boolean) => (none.value = v),
        }),
        h('output', { 'data-testid': 'state' }, `${seat.value}|${none.value}`),
      ])
  })

  it('never keeps a seat and "nobody" selected together', async () => {
    const w = mount(Parent, options())
    const state = () => w.find('[data-testid="state"]').text()
    const checked = () => w.findAll('[aria-checked="true"]').map((b) => b.text())
    await w.find('[data-testid="seat-3"]').trigger('click')
    expect(state()).toBe('3|false')
    await w.find('[data-testid="seat-none"]').trigger('click')
    expect(state()).toBe('null|true')
    expect(checked()).toEqual(['空刀'])
    await w.find('[data-testid="seat-4"]').trigger('click')
    expect(state()).toBe('4|false')
    expect(checked()).toEqual(['4'])
    await w.find('[data-testid="seat-none"]').trigger('click')
    await w.find('[data-testid="seat-none"]').trigger('click')
    expect(state()).toBe('null|false')
  })
})

describe('QR codes', () => {
  it("recognises the suite's share links and opens them on the site in use", async () => {
    const { toolLinkTarget } = await import('./scan.ts')
    const here = 'http://localhost:5173'
    expect(toolLinkTarget('https://werewolf.mirumo.net/judge/?s=zAbC_-1', here)).toBe(
      `${here}/judge/?s=zAbC_-1`,
    )
    expect(toolLinkTarget('https://werewolf.mirumo.net/judge?t=jXY', here)).toBe(
      `${here}/judge/?t=jXY`,
    )
    expect(toolLinkTarget(' https://werewolf.mirumo.net/deal/?b=zQ#/x ', here)).toBe(
      `${here}/deal/?b=zQ`,
    )
    expect(toolLinkTarget('https://werewolf.mirumo.net/judge/', here)).toBeNull()
    expect(toolLinkTarget('https://werewolf.mirumo.net/?s=x', here)).toBeNull()
    expect(toolLinkTarget('https://example.com/dealer/?b=x', here)).toBeNull()
    expect(toolLinkTarget('javascript:alert(1)', here)).toBeNull()
    expect(toolLinkTarget('hello', here)).toBeNull()
  })

  it('draws a QR code', async () => {
    const { default: QrCode } = await import('./QrCode.vue')
    const w = mount(QrCode, {
      ...options(),
      props: { value: 'https://werewolf.mirumo.net/judge/?s=x', label: 'qr' },
    })
    expect(w.find('[data-testid="qr-code"] svg').exists()).toBe(true)
  })

  it('says so when there is no camera', async () => {
    const { default: QrScanner } = await import('./QrScanner.vue')
    const w = mount(QrScanner, { ...options(), props: { open: false } })
    await w.setProps({ open: true })
    await nextTick()
    expect(w.find('[data-testid="scan-status"]').text()).toBe('這個裝置或瀏覽器無法使用相機。')
  })

  it('opens a scanned share link and ignores other codes', async () => {
    const { default: QrScanner } = await import('./QrScanner.vue')
    const stopped: string[] = []
    const stream = { getTracks: () => [{ stop: () => stopped.push('track') }] }
    vi.stubGlobal('navigator', { ...navigator, mediaDevices: { getUserMedia: async () => stream } })
    const codes = ['https://example.com/', 'https://werewolf.mirumo.net/judge/?s=zGame']
    vi.stubGlobal(
      'BarcodeDetector',
      class {
        async detect() {
          const next = codes.shift()
          return next ? [{ rawValue: next }] : []
        }
      },
    )
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    const go = vi.fn()
    const w = mount(QrScanner, {
      ...options(),
      props: { open: false, go },
      attachTo: document.body,
    })
    await w.setProps({ open: true })
    await vi.waitFor(() => expect(w.find('[data-testid="scan-not-ours"]').exists()).toBe(true))
    await vi.waitFor(() => expect(go).toHaveBeenCalledWith(`${location.origin}/judge/?s=zGame`), {
      timeout: 2000,
    })
    expect(stopped).toEqual(['track'])
    w.unmount()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })
})

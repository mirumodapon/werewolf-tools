<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CHECK_TIMEOUT_MS, RESUME_CHECK_MS, UPDATE_RELOAD_MS } from './update.ts'

/**
 * Checks for a new version whenever the app starts (or returns after a long time in the
 * background) and applies it at once. Offline or slow checks never block the app.
 */
const props = withDefaults(defineProps<{ enabled?: boolean }>(), {
  // No service worker on the dev server.
  enabled: () => !import.meta.env.DEV,
})
defineSlots<{ default(): unknown }>()
const { t } = useI18n()

const canCheck = () =>
  props.enabled &&
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  navigator.onLine !== false
const checking = ref(canCheck())
let registration: ServiceWorkerRegistration | undefined
let timeout: ReturnType<typeof setTimeout> | undefined

function finish() {
  checking.value = false
  clearTimeout(timeout)
}

function startCheck() {
  checking.value = true
  clearTimeout(timeout)
  timeout = setTimeout(finish, CHECK_TIMEOUT_MS)
}

async function check(r: ServiceWorkerRegistration | undefined) {
  if (!r) return finish()
  if (r.waiting) return // needRefresh takes over
  try {
    await r.update()
  } catch {
    return finish()
  }
  const incoming = r.installing ?? r.waiting
  if (!incoming) return finish()
  incoming.addEventListener('statechange', () => {
    if (incoming.state === 'redundant') finish()
  })
}

const { needRefresh, updateServiceWorker } = useRegisterSW({
  immediate: true,
  onRegisteredSW(_url, r) {
    registration = r
    if (canCheck()) void check(r)
    else finish()
  },
  onRegisterError: finish,
})

let applying = false
watch(
  needRefresh,
  (found) => {
    if (!found || applying) return
    applying = true
    void updateServiceWorker(true)
    setTimeout(() => window.location.reload(), UPDATE_RELOAD_MS)
  },
  { immediate: true },
)

let hiddenAt = 0
function onVisibility() {
  if (document.visibilityState === 'hidden') hiddenAt = Date.now()
  else if (hiddenAt && Date.now() - hiddenAt >= RESUME_CHECK_MS && canCheck()) {
    startCheck()
    void check(registration)
  }
}
onMounted(() => {
  if (checking.value) startCheck()
  document.addEventListener('visibilitychange', onVisibility)
})
onBeforeUnmount(() => {
  clearTimeout(timeout)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<template>
  <slot />
  <output
    v-if="needRefresh || checking"
    aria-live="polite"
    class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg text-fg"
    data-testid="update-gate"
  >
    <span class="i-tabler-moon-stars size-14 text-purple" aria-hidden="true" />
    <span class="flex items-center gap-2 text-lg font-bold">
      <span class="i-tabler-loader-2 size-6 animate-spin text-cyan" aria-hidden="true" />
      {{ needRefresh ? t('update.updating') : t('update.checking') }}
    </span>
  </output>
</template>

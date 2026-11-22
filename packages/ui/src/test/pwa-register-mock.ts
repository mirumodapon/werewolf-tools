import { ref } from 'vue'

/** Stand-in for `virtual:pwa-register/vue` in tests (no service worker there). */
export const needRefresh = ref(false)
export const updateCalls: boolean[] = []

export function useRegisterSW() {
  return {
    needRefresh,
    offlineReady: ref(false),
    updateServiceWorker: async (reload?: boolean) => void updateCalls.push(Boolean(reload)),
  }
}

import { onBeforeUnmount, onMounted, toValue, type MaybeRefOrGetter } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

/**
 * While a card is face up, the back key, leaving the page, switching apps or locking the
 * phone only turn it face down.
 */
export function usePrivacyGuard(active: MaybeRefOrGetter<boolean>, onHide: () => void): void {
  onBeforeRouteLeave(() => {
    if (!toValue(active)) return true
    onHide()
    return false
  })
  const onVisibility = () => {
    if (document.visibilityState === 'hidden' && toValue(active)) onHide()
  }
  const onPageHide = () => {
    if (toValue(active)) onHide()
  }
  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('pagehide', onPageHide)
  })
}

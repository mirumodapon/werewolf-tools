import { onMounted } from 'vue'

/** Taps right after the card turns over are the hold being released. */
export const IGNORE_TAPS_MS = 500
export const DOUBLE_TAP_MS = 300

/** A click handler that fires `onDouble` on two quick taps. */
export function useDoubleTap(onDouble: () => void): () => void {
  let shownAt = performance.now()
  let lastTap = 0
  onMounted(() => (shownAt = performance.now()))
  return () => {
    const now = performance.now()
    if (now - shownAt < IGNORE_TAPS_MS) return
    if (now - lastTap < DOUBLE_TAP_MS) {
      lastTap = 0
      onDouble()
    } else {
      lastTap = now
    }
  }
}

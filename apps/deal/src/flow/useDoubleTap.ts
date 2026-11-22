import { onBeforeUnmount, onMounted } from 'vue'

/** Taps right after the card turns over are the hold being released. */
export const IGNORE_TAPS_MS = 500
export const DOUBLE_TAP_MS = 300

/**
 * Calls `onDouble` on two quick taps anywhere on the screen while the component is
 * mounted, ignoring taps in the first IGNORE_TAPS_MS (the hold that turned the card over).
 * Pointer events, so touch, pen and mouse all count, with no click delay.
 */
export function useDoubleTap(
  onDouble: () => void,
  target: () => EventTarget = () => document,
): void {
  let shownAt = 0
  let lastTap = 0

  function onTap(e: Event) {
    const now = performance.now()
    if (now - shownAt < IGNORE_TAPS_MS) return
    if (now - lastTap < DOUBLE_TAP_MS) {
      lastTap = 0
      // No zoom, selection or click on whatever is under the second tap.
      e.preventDefault()
      onDouble()
    } else {
      lastTap = now
    }
  }

  onMounted(() => {
    shownAt = performance.now()
    target().addEventListener('pointerup', onTap)
  })
  onBeforeUnmount(() => target().removeEventListener('pointerup', onTap))
}

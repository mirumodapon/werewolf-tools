import { onBeforeUnmount, ref } from 'vue'

/** How long a card must be held to turn over. */
export const HOLD_MS = 1000

/**
 * Press and hold, for touch, pen and mouse. Lifting early, sliding off or the browser
 * cancelling the touch resets it. Touch pointers are captured, so leaving is checked on
 * move. Bind with `v-on="handlers"`.
 */
export function useHold(onDone: () => void, ms = HOLD_MS) {
  const holding = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null
  let rect: DOMRect | null = null

  function cancel() {
    if (timer) clearTimeout(timer)
    timer = null
    rect = null
    holding.value = false
  }
  onBeforeUnmount(cancel)
  const prevent = (e: Event) => e.preventDefault()

  const handlers = {
    pointerdown(e: PointerEvent) {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      cancel()
      rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      holding.value = true
      timer = setTimeout(() => {
        timer = null
        holding.value = false
        navigator.vibrate?.(60)
        onDone()
      }, ms)
    },
    pointermove(e: PointerEvent) {
      if (
        rect &&
        (e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom)
      )
        cancel()
    },
    pointerup: cancel,
    pointercancel: cancel,
    pointerleave: cancel,
    contextmenu: prevent,
    dragstart: prevent,
  }
  return { holding, handlers }
}

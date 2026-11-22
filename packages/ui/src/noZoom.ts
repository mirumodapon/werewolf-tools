/**
 * Turns off zooming on phones, which the viewport meta and `touch-action` alone do not
 * fully do (iOS Safari ignores `user-scalable=no`): the second touch of a quick double
 * tap, pinch gestures and `dblclick` are cancelled. Cancelling a touch also cancels the
 * click the browser would make from it, so the click is sent by hand: tapping two buttons
 * or seats in quick succession works. Text fields are left alone so they still get focus.
 * Pointer events arrive before any of this, so the apps' own double tap keeps working.
 * Returns a function that removes the guard.
 */
export const DOUBLE_TOUCH_MS = 350

/** Fields that need the touch to focus and place the caret. */
const TEXT_FIELDS =
  'input:not([type=button]):not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable]'

export function noZoom(target: Document = document): () => void {
  let lastTouchEnd = 0
  const onTouchEnd = (e: TouchEvent) => {
    const now = e.timeStamp
    const quick = now - lastTouchEnd <= DOUBLE_TOUCH_MS
    lastTouchEnd = now
    const el = e.target instanceof Element ? e.target : null
    if (!quick || !e.cancelable || !el || el.closest(TEXT_FIELDS)) return
    e.preventDefault()
    // The browser will not click now: do it, so a fast second tap still counts.
    const clickable = el.closest<HTMLElement>('button, a, label, [role], input, select') ?? el
    if (clickable instanceof HTMLElement) clickable.click()
  }
  const cancel = (e: Event) => e.preventDefault()
  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 1 && e.cancelable) e.preventDefault()
  }
  target.addEventListener('touchend', onTouchEnd, { passive: false })
  target.addEventListener('touchmove', onTouchMove, { passive: false })
  target.addEventListener('gesturestart', cancel, { passive: false })
  target.addEventListener('dblclick', cancel, { passive: false })
  return () => {
    target.removeEventListener('touchend', onTouchEnd)
    target.removeEventListener('touchmove', onTouchMove)
    target.removeEventListener('gesturestart', cancel)
    target.removeEventListener('dblclick', cancel)
  }
}

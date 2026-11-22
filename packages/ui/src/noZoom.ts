/**
 * Turns off zooming on phones, which the viewport meta and `touch-action` alone do not
 * fully do (iOS Safari ignores `user-scalable=no`): the second touch of a quick double
 * tap, pinch gestures and `dblclick` are cancelled. Pointer events still arrive first, so
 * the apps' own double tap (pointerup) keeps working. Returns a function that removes it.
 */
export const DOUBLE_TOUCH_MS = 350

export function noZoom(target: Document = document): () => void {
  let lastTouchEnd = 0
  const onTouchEnd = (e: TouchEvent) => {
    const now = e.timeStamp
    if (now - lastTouchEnd <= DOUBLE_TOUCH_MS && e.cancelable) e.preventDefault()
    lastTouchEnd = now
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

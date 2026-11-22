import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ConfirmOptions {
  message: string
  title?: string
  confirmLabel?: string
  /** Destructive (delete, abandon): a red button. */
  danger?: boolean
}

/** In-app `window.confirm`: `await ask({ message })`; `<ConfirmHost>` shows the question. */
export const useConfirmStore = defineStore('confirm', () => {
  const current = ref<ConfirmOptions | null>(null)
  let resolve: ((ok: boolean) => void) | null = null

  function ask(options: ConfirmOptions): Promise<boolean> {
    resolve?.(false)
    current.value = options
    return new Promise((r) => (resolve = r))
  }

  function answer(ok: boolean) {
    const r = resolve
    resolve = null
    current.value = null
    r?.(ok)
  }

  return { current, ask, answer }
})

export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const store = useConfirmStore()
  return (options) => store.ask(options)
}

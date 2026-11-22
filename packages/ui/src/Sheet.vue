<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

/** A bottom sheet on `<dialog>`: Esc, the backdrop and the close button dismiss it. */
const open = defineModel<boolean>('open', { required: true })
defineProps<{ title: string }>()
defineSlots<{ default(): unknown }>()
const { t } = useI18n()
const dialog = ref<HTMLDialogElement | null>(null)

watch(
  [open, dialog],
  ([isOpen, el]) => {
    if (!el) return
    // jsdom has no showModal(): fall back to the attribute.
    if (isOpen && !el.open) {
      if (el.showModal) el.showModal()
      else el.setAttribute('open', '')
    }
    if (!isOpen && el.open) {
      if (el.close) el.close()
      else el.removeAttribute('open')
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => dialog.value?.close?.())

function onBackdrop(e: MouseEvent) {
  if (e.target === dialog.value) open.value = false
}
</script>

<template>
  <dialog
    ref="dialog"
    class="m-0 mt-auto w-full max-w-none border-0 bg-transparent p-0 text-fg backdrop:bg-black/50 sm:mx-auto sm:max-w-xl"
    @close="open = false"
    @click="onBackdrop"
  >
    <div
      v-if="open"
      class="flex max-h-[85dvh] flex-col gap-3 overflow-y-auto rounded-t-2xl border border-border bg-raised p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div class="flex items-center gap-2">
        <h2 class="flex-1 text-lg font-bold">{{ title }}</h2>
        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-full hover:bg-bg"
          :aria-label="t('common.close')"
          @click="open = false"
        >
          <span class="i-tabler-x size-5" aria-hidden="true" />
        </button>
      </div>
      <slot />
    </div>
  </dialog>
</template>

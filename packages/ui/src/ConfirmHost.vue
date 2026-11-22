<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirmStore } from './confirmStore.ts'
import Sheet from './Sheet.vue'

/** Shows the pending `useConfirm()` question. Closing it means cancel. */
const { t } = useI18n()
const store = useConfirmStore()
const open = computed({
  get: () => store.current !== null,
  set: (value: boolean) => {
    if (!value && store.current) store.answer(false)
  },
})
</script>

<template>
  <Sheet v-model:open="open" :title="store.current?.title ?? t('common.confirmTitle')">
    <template v-if="store.current">
      <p class="text-lg" data-testid="confirm-message">{{ store.current.message }}</p>
      <div class="flex gap-2">
        <button
          type="button"
          class="h-12 flex-1 rounded-xl bg-surface font-bold"
          data-testid="confirm-cancel"
          @click="store.answer(false)"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          type="button"
          class="h-12 flex-1 rounded-xl font-bold text-bg"
          :class="store.current.danger ? 'bg-red' : 'bg-purple'"
          data-testid="confirm-ok"
          @click="store.answer(true)"
        >
          {{ store.current.confirmLabel ?? t('common.confirm') }}
        </button>
      </div>
    </template>
  </Sheet>
</template>

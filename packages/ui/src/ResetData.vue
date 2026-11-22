<script setup lang="ts">
import { pwaTools } from '@werewolf/registry'
import { appDatabaseName, clearAllData } from '@werewolf/storage'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirm } from './confirmStore.ts'

/** 「刪除所有資料」: wipes every tool's data on this device after a confirmation, then reloads. */
const { t } = useI18n()
const confirm = useConfirm()
const busy = ref(false)

async function reset() {
  const ok = await confirm({
    title: t('reset.title'),
    message: t('reset.confirm'),
    confirmLabel: t('reset.action'),
    danger: true,
  })
  if (!ok) return
  busy.value = true
  await clearAllData(pwaTools().map((tool) => appDatabaseName(tool.id)))
  window.location.reload()
}
</script>

<template>
  <section class="flex flex-col gap-2">
    <h3 class="text-sm text-subtle">{{ t('reset.title') }}</h3>
    <p class="text-sm text-comment">{{ t('reset.hint') }}</p>
    <button
      type="button"
      class="h-11 rounded-xl border border-red font-bold text-red disabled:opacity-40"
      :disabled="busy"
      data-testid="reset-data"
      @click="reset"
    >
      <span class="i-tabler-trash mr-1 size-5" aria-hidden="true" />{{ t('reset.action') }}
    </button>
  </section>
</template>

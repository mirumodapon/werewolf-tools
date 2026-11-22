<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { checkForUpdate, type UpdateCheck } from './update.ts'

/** 「檢查更新」: checks for a new version on demand; a found one is applied by UpdateGate. */
const props = defineProps<{ check?: () => Promise<UpdateCheck> }>()
const { t } = useI18n()
const state = ref<'idle' | 'checking' | UpdateCheck>('idle')

async function run() {
  state.value = 'checking'
  state.value = await (props.check ?? checkForUpdate)()
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <button
      type="button"
      class="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-surface font-bold disabled:opacity-60"
      :disabled="state === 'checking' || state === 'found'"
      data-testid="check-update"
      @click="run"
    >
      <span
        :class="state === 'checking' ? 'i-tabler-loader-2 animate-spin' : 'i-tabler-refresh'"
        class="size-5"
        aria-hidden="true"
      />{{ state === 'checking' ? t('update.checking') : t('update.check') }}
    </button>
    <p
      v-if="state !== 'idle' && state !== 'checking'"
      class="text-sm"
      :class="state === 'found' ? 'text-cyan' : state === 'latest' ? 'text-green' : 'text-comment'"
      role="status"
      data-testid="update-result"
    >
      {{ t(`update.result.${state}`) }}
    </p>
  </div>
</template>

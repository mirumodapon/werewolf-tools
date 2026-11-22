<script setup lang="ts">
import { encodeHandoff, HANDOFF_PARAM } from '@werewolf/boards'
import { toolById } from '@werewolf/registry'
import { shareUrl } from '@werewolf/share'
import { ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DealRecord } from '../history/records.ts'

/** Opens the moderator assistant with this deal's table already filled in. */
const props = defineProps<{ record: DealRecord }>()
const { t } = useI18n()
const href = ref('')
watchEffect(async () => {
  const r = props.record
  const payload = await encodeHandoff({
    boardId: r.boardId,
    boardName: r.boardName,
    roles: r.roles,
    rules: r.rules,
    table: r.assignments,
  })
  href.value = shareUrl(
    new URL(toolById('judge').path, location.href).toString(),
    HANDOFF_PARAM,
    payload,
  )
})
</script>

<template>
  <a
    :href="href || undefined"
    class="flex h-12 items-center justify-center gap-1 rounded-xl bg-surface font-bold"
    data-testid="to-judge"
  >
    <span class="i-tabler-gavel size-5" aria-hidden="true" />{{ t('flow.toJudge') }}
  </a>
</template>

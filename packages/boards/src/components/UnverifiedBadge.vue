<script setup lang="ts">
import { useI18n } from 'vue-i18n'

/** 「未驗證」: the board's moderator logic has not been checked by a person. */
const { t } = useI18n()
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center gap-0.5 rounded bg-orange/15 px-1.5 text-xs text-orange"
    :title="t('boards.unverifiedHint')"
    data-testid="unverified"
  >
    <span class="i-tabler-alert-triangle size-3" aria-hidden="true" />{{ t('boards.unverified') }}
  </span>
</template>

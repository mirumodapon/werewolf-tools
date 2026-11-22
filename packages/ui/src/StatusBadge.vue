<script setup lang="ts">
import type { ToolStatus } from '@werewolf/registry'
import { useI18n } from 'vue-i18n'

/** `alpha` / `beta` / `rc` chip; nothing for stable tools. */
defineProps<{ status: ToolStatus }>()
const { t } = useI18n()
</script>

<template>
  <span
    v-if="status !== 'stable'"
    class="shrink-0 rounded bg-surface px-1.5 font-mono text-xs font-normal"
    :class="status === 'alpha' ? 'text-orange' : 'text-comment'"
    :data-testid="`status-${status}`"
    >{{ t(`status.${status}`) }}</span
  >
</template>

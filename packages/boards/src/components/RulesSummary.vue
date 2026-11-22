<script setup lang="ts">
import type { BoardRules } from '@werewolf/rules'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/** A board's settings in one line: 屠邊 · 同守同救會死 · 有警長 … */
const props = defineProps<{ rules: BoardRules }>()
const { t } = useI18n()
const parts = computed(() => [
  t(`rules.win.${props.rules.win}`),
  `${t('rules.guardSaveConflict.label')}：${t(`rules.guardSaveConflict.${props.rules.guardSaveConflict}`)}`,
  `${t('rules.sheriff.label')}：${t(props.rules.sheriff ? 'rules.sheriff.on' : 'rules.sheriff.off')}`,
  t(`rules.lastWords.${props.rules.lastWords}`),
])
</script>

<template>
  <p class="text-xs text-comment">{{ parts.join(' · ') }}</p>
</template>

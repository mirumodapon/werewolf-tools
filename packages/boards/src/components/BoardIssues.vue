<script setup lang="ts">
import type { BoardIssue } from '@werewolf/rules'
import { useBoardText } from '../useBoardText.ts'

/** `checkBoard` results: errors red, warnings yellow. */
defineProps<{ issues: readonly BoardIssue[]; showOk?: boolean }>()
const { t, issueText } = useBoardText()
</script>

<template>
  <ul v-if="issues.length" class="flex flex-col gap-1 text-sm" role="status">
    <li
      v-for="(issue, i) in issues"
      :key="i"
      class="flex items-start gap-2"
      :class="issue.level === 'error' ? 'text-red' : 'text-yellow'"
    >
      <span
        :class="issue.level === 'error' ? 'i-tabler-alert-circle' : 'i-tabler-alert-triangle'"
        class="mt-0.5 size-4 shrink-0"
        aria-hidden="true"
      />
      {{ issueText(issue) }}
    </li>
  </ul>
  <p v-else-if="showOk" class="flex items-center gap-2 text-sm text-green">
    <span class="i-tabler-circle-check size-4" aria-hidden="true" />{{ t('boards.noIssues') }}
  </p>
</template>

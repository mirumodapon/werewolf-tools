<script setup lang="ts">
import { isUnverified, playerCount, type Board } from '@werewolf/rules'
import { useBoardText } from '../useBoardText.ts'
import RoleChips from './RoleChips.vue'
import RulesSummary from './RulesSummary.vue'
import UnverifiedBadge from './UnverifiedBadge.vue'

/** One board: name, built-in or custom, 「未驗證」, cards, settings and note. */
defineProps<{ board: Board; showCount?: boolean }>()
defineSlots<{ actions?(): unknown }>()
const { t, boardName } = useBoardText()
</script>

<template>
  <span class="flex flex-col gap-2">
    <span class="flex flex-wrap items-center gap-2">
      <span class="min-w-0 flex-1 font-bold">{{ boardName(board.name) }}</span>
      <span v-if="showCount" class="text-sm text-comment">{{
        t('common.players', { n: playerCount(board.roles) })
      }}</span>
      <UnverifiedBadge v-if="isUnverified(board)" />
      <span class="rounded bg-surface px-1.5 text-xs text-comment">{{
        board.builtin ? t('boards.builtin') : t('boards.custom')
      }}</span>
    </span>
    <RoleChips :roles="board.roles" />
    <RulesSummary :rules="board.rules" />
    <span v-if="board.note" class="text-sm text-comment">{{ boardName(board.note) }}</span>
    <slot name="actions" />
  </span>
</template>

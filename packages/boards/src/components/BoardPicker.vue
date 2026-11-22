<script setup lang="ts">
import { checkBoard, isUnverified, MAX_PLAYERS, MIN_PLAYERS, type Board } from '@werewolf/rules'
import { computed, watchEffect } from 'vue'
import { useBoardsStore } from '../store.ts'
import { useBoardText } from '../useBoardText.ts'
import BoardCard from './BoardCard.vue'
import BoardIssues from './BoardIssues.vue'

/**
 * Player count, then a board of that size (built-in first). Keeps a board selected while
 * one fits; the `empty` slot shows when none does.
 */
const count = defineModel<number>('count', { required: true })
const boardId = defineModel<string | null>('boardId', { required: true })
defineSlots<{ empty?(): unknown }>()
const { t } = useBoardText()
const boards = useBoardsStore()

const counts = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i)
const available = computed(() => boards.forCount(count.value))
const selected = computed<Board | undefined>(() =>
  available.value.find((b) => b.id === boardId.value),
)
const issues = computed(() => (selected.value ? checkBoard(selected.value.roles) : []))

watchEffect(() => {
  if (!selected.value && available.value.length) boardId.value = available.value[0]!.id
})
</script>

<template>
  <section class="flex flex-col gap-2">
    <h2 class="text-sm text-subtle">{{ t('boards.players') }}</h2>
    <div class="grid grid-cols-7 gap-1" role="radiogroup" :aria-label="t('boards.players')">
      <button
        v-for="n in counts"
        :key="n"
        type="button"
        role="radio"
        :aria-checked="count === n"
        class="h-11 rounded-lg font-mono text-lg"
        :class="count === n ? 'bg-purple font-bold text-bg' : 'bg-surface text-muted'"
        :data-testid="`count-${n}`"
        @click="count = n"
      >
        {{ n }}
      </button>
    </div>
  </section>

  <section class="flex flex-col gap-2">
    <h2 class="text-sm text-subtle">{{ t('boards.board') }}</h2>
    <div v-if="!available.length" class="flex flex-col gap-2 rounded-xl border border-border p-3">
      <p class="text-muted">{{ t('boards.noneForCount', { n: count }) }}</p>
      <slot name="empty" />
    </div>
    <ul v-else class="flex flex-col gap-2" role="radiogroup" :aria-label="t('boards.board')">
      <li v-for="b in available" :key="b.id">
        <button
          type="button"
          role="radio"
          :aria-checked="selected?.id === b.id"
          class="w-full rounded-xl border-2 p-3 text-left"
          :class="selected?.id === b.id ? 'border-purple bg-raised' : 'border-border'"
          :data-testid="`board-${b.id}`"
          @click="boardId = b.id"
        >
          <BoardCard :board="b" />
        </button>
      </li>
    </ul>
    <p v-if="selected && isUnverified(selected)" class="flex items-start gap-2 text-sm text-orange">
      <span class="i-tabler-alert-triangle mt-0.5 size-4 shrink-0" aria-hidden="true" />{{
        t('boards.unverifiedHint')
      }}
    </p>
    <BoardIssues :issues="issues" />
  </section>
</template>

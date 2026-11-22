<script setup lang="ts">
import { BoardPicker, useBoardsStore, useBoardText } from '@werewolf/boards'
import { BUILTIN_BOARDS, checkBoard, hasErrors, playerCount } from '@werewolf/rules'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { createDeal, useFlowStore } from '../../stores/flow.ts'
import { useHistoryStore } from '../../stores/history.ts'
import { useSettingsStore } from '../../stores/settings.ts'

const { t, boardName } = useBoardText()
const router = useRouter()
const settings = useSettingsStore()
const boards = useBoardsStore()
const history = useHistoryStore()
const flow = useFlowStore()

const selected = computed(() =>
  boards.forCount(settings.playerCount).find((b) => b.id === settings.boardId),
)
const blocked = computed(() => !selected.value || hasErrors(checkBoard(selected.value.roles)))

/** The built-in board closest in size, for counts without one. */
const nearest = computed(
  () =>
    BUILTIN_BOARDS.toSorted(
      (a, b) =>
        Math.abs(playerCount(a.roles) - settings.playerCount) -
        Math.abs(playerCount(b.roles) - settings.playerCount),
    )[0]!,
)

async function start() {
  if (!selected.value || blocked.value) return
  const record = createDeal(selected.value)
  await history.add(record)
  flow.start(record, 'deal')
  await router.push('/deal')
}
</script>

<template>
  <BoardPicker v-model:count="settings.playerCount" v-model:board-id="settings.boardId">
    <template #empty>
      <RouterLink to="/boards/new" class="rounded-lg bg-surface px-3 py-2 text-center">
        <span class="i-tabler-plus mr-1 size-5" aria-hidden="true" />{{ t('deal.createCustom') }}
      </RouterLink>
      <RouterLink
        :to="{ path: '/boards/new', query: { from: nearest.id } }"
        class="rounded-lg bg-surface px-3 py-2 text-center"
      >
        <span class="i-tabler-copy mr-1 size-5" aria-hidden="true" />{{
          t('deal.copyNearest', { name: boardName(nearest.name), n: playerCount(nearest.roles) })
        }}
      </RouterLink>
    </template>
  </BoardPicker>

  <button
    type="button"
    class="sticky bottom-4 mt-2 flex h-14 items-center justify-center gap-2 rounded-2xl bg-purple text-lg font-bold text-bg shadow-lg disabled:opacity-40"
    data-testid="start"
    :disabled="blocked"
    @click="start"
  >
    <span class="i-tabler-cards size-6" aria-hidden="true" />{{ t('deal.start') }}
  </button>
</template>

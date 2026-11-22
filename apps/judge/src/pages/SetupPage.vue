<script setup lang="ts">
import {
  BoardPicker,
  RoleChips,
  RulesSummary,
  UnverifiedBadge,
  useBoardsStore,
  type Handoff,
} from '@werewolf/boards'
import {
  builtinBoard,
  checkBoard,
  DEFAULT_RULES,
  hasErrors,
  playerCount,
  type Board,
} from '@werewolf/rules'
import { toolById } from '@werewolf/registry'
import { AppShell } from '@werewolf/ui'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGamesStore } from '../stores/games.ts'
import { useSettingsStore } from '../stores/settings.ts'
import { useJudgeText } from '../useJudgeText.ts'

/** Pick a board (or take the one handed over from the deal tool) and start. */
const props = defineProps<{ handoff?: Handoff | null }>()
const { t, boardName } = useJudgeText()
const router = useRouter()
const settings = useSettingsStore()
const boards = useBoardsStore()
const games = useGamesStore()
const name = ref('')

/** The handed-over board, as the shared list knows it (rules and verified flag) or as sent. */
const handedBoard = computed<Board | null>(() => {
  const h = props.handoff
  if (!h) return null
  const known = boards.byId(h.boardId) ?? builtinBoard(h.boardId)
  return {
    id: h.boardId ?? 'handoff',
    name: h.boardName,
    roles: h.roles,
    rules: h.rules ?? DEFAULT_RULES,
    builtin: known?.builtin ?? false,
    verified: known?.verified ?? false,
  }
})
const selected = computed(
  () =>
    handedBoard.value ??
    boards.forCount(settings.playerCount).find((b) => b.id === settings.boardId),
)
const blocked = computed(() => !selected.value || hasErrors(checkBoard(selected.value.roles)))

async function start() {
  if (!selected.value || blocked.value) return
  const game = await games.create(selected.value, props.handoff ?? undefined)
  if (name.value.trim()) await games.rename(name.value)
  await router.replace(`/play/${game.id}`)
}
</script>

<template>
  <AppShell :title="t('setup.title')" :back-label="t('common.back')" @back="router.push('/')">
    <template v-if="handedBoard">
      <p class="flex items-center gap-2 text-green">
        <span class="i-tabler-circle-check size-5" aria-hidden="true" />{{ t('setup.fromDeal') }}
      </p>
      <div class="flex flex-col gap-2 rounded-xl border-2 border-purple p-3">
        <span class="flex items-center gap-2">
          <span class="flex-1 font-bold">{{ boardName(handedBoard.name) }}</span>
          <span class="text-sm text-comment">{{
            t('common.players', { n: playerCount(handedBoard.roles) })
          }}</span>
          <UnverifiedBadge v-if="!handedBoard.verified" />
        </span>
        <RoleChips :roles="handedBoard.roles" />
        <RulesSummary :rules="handedBoard.rules" />
      </div>
    </template>
    <template v-else>
      <BoardPicker v-model:count="settings.playerCount" v-model:board-id="settings.boardId">
        <template #empty>
          <a :href="toolById('deal').path" class="rounded-lg bg-surface px-3 py-2 text-center">
            <span class="i-tabler-cards mr-1 size-5" aria-hidden="true" />{{ t('setup.deal') }}
          </a>
        </template>
      </BoardPicker>
      <p class="text-sm text-comment">{{ t('setup.unknownTable') }}</p>
    </template>

    <label class="flex flex-col gap-1">
      <span class="text-sm text-subtle">{{ t('setup.name') }}</span>
      <input
        v-model="name"
        maxlength="40"
        class="rounded-lg border border-border bg-bg px-3 py-2"
      />
    </label>

    <button
      type="button"
      class="sticky bottom-4 mt-auto flex h-14 items-center justify-center gap-2 rounded-2xl bg-purple text-lg font-bold text-bg shadow-lg disabled:opacity-40"
      :disabled="blocked"
      data-testid="start"
      @click="start"
    >
      <span class="i-tabler-player-play size-6" aria-hidden="true" />{{ t('setup.start') }}
    </button>
  </AppShell>
</template>

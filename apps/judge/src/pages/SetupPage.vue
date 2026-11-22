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
  type JudgeOptions,
} from '@werewolf/rules'
import { toolById } from '@werewolf/registry'
import { AppShell, BottomBar } from '@werewolf/ui'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdvancedOptions from '../components/AdvancedOptions.vue'
import { useGamesStore } from '../stores/games.ts'
import { useSettingsStore } from '../stores/settings.ts'
import { useJudgeText } from '../useJudgeText.ts'

/**
 * Two stages before a game: the board (picked here or handed over from the deal tool),
 * then the advanced settings that board offers. Then the game starts.
 */
const props = defineProps<{ handoff?: Handoff | null }>()
const { t, boardName } = useJudgeText()
const router = useRouter()
const settings = useSettingsStore()
const boards = useBoardsStore()
const games = useGamesStore()
// A deal handed over already fixes the board: go straight to the advanced settings.
const stage = ref<'board' | 'options'>(props.handoff ? 'options' : 'board')
const name = ref('')
const options = ref<JudgeOptions>({})

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

function toOptions() {
  if (blocked.value) return
  // Each board offers its own options: start from the defaults whenever the board changes.
  options.value = {}
  stage.value = 'options'
}

function back() {
  if (stage.value === 'options' && !props.handoff) stage.value = 'board'
  else void router.push('/')
}

async function start() {
  if (!selected.value || blocked.value) return
  const game = await games.create(selected.value, props.handoff ?? undefined, options.value)
  if (name.value.trim()) await games.rename(name.value)
  await router.replace(`/play/${game.id}`)
}
</script>

<template>
  <AppShell :title="t('setup.title')" :back-label="t('common.back')" @back="back">
    <ol class="flex gap-2 text-sm" :aria-label="t('setup.title')">
      <li
        v-for="(s, i) in ['board', 'options'] as const"
        :key="s"
        class="flex flex-1 items-center gap-2 rounded-lg px-3 py-2"
        :class="stage === s ? 'bg-purple font-bold text-bg' : 'bg-surface text-comment'"
        :aria-current="stage === s ? 'step' : undefined"
      >
        <span class="font-mono">{{ i + 1 }}</span>{{ t(`setup.stages.${s}`) }}
      </li>
    </ol>

    <template v-if="stage === 'board'">
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

      <BottomBar>
        <button
          type="button"
          class="w-full flex h-14 items-center justify-center gap-2 rounded-2xl bg-purple text-lg font-bold text-bg disabled:opacity-40"
          :disabled="blocked"
          data-testid="next"
          @click="toOptions"
        >
          {{ t('setup.next') }}<span class="i-tabler-arrow-right size-6" aria-hidden="true" />
        </button>
      </BottomBar>
    </template>

    <template v-else-if="selected">
      <p v-if="handedBoard" class="flex items-center gap-2 text-green">
        <span class="i-tabler-circle-check size-5" aria-hidden="true" />{{ t('setup.fromDeal') }}
      </p>
      <div class="flex flex-col gap-2 rounded-xl border border-border p-3">
        <span class="flex items-center gap-2">
          <span class="flex-1 font-bold">{{ boardName(selected.name) }}</span>
          <span class="text-sm text-comment">{{
            t('common.players', { n: playerCount(selected.roles) })
          }}</span>
          <UnverifiedBadge v-if="!selected.verified" />
        </span>
        <RoleChips :roles="selected.roles" />
        <RulesSummary :rules="selected.rules" />
      </div>

      <AdvancedOptions v-model="options" :roles="selected.roles" />

      <label class="flex flex-col gap-1">
        <span class="text-sm text-subtle">{{ t('setup.name') }}</span>
        <input
          v-model="name"
          maxlength="40"
          class="rounded-lg border border-border bg-bg px-3 py-2"
        />
      </label>

      <BottomBar>
        <button
          type="button"
          class="w-full flex h-14 items-center justify-center gap-2 rounded-2xl bg-purple text-lg font-bold text-bg"
          data-testid="start"
          @click="start"
        >
          <span class="i-tabler-player-play size-6" aria-hidden="true" />{{ t('setup.start') }}
        </button>
      </BottomBar>
    </template>
  </AppShell>
</template>

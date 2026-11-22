<script setup lang="ts">
import { UnverifiedBadge } from '@werewolf/boards'
import type { GameEvent, RoleId, Winner } from '@werewolf/rules'
import { AppShell, IconButton, Sheet, useConfirm } from '@werewolf/ui'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SeatTable from '../components/SeatTable.vue'
import StepPanel from '../components/StepPanel.vue'
import { derive, isVerified } from '../games/game.ts'
import { useGamesStore } from '../stores/games.ts'
import { useJudgeText } from '../useJudgeText.ts'

/** Moderating: the current step, undo, the seat table and ending by hand. */
const props = defineProps<{ id: string }>()
const { t, gameName, logText, roleName } = useJudgeText()
const router = useRouter()
const store = useGamesStore()
const confirm = useConfirm()
const missing = ref(false)
const tableOpen = ref(false)
const endOpen = ref(false)

onMounted(async () => {
  if (!(await store.open(props.id))) missing.value = true
})

const game = computed(() => store.current)
const derived = computed(() => store.derived)
const state = computed(() => derived.value?.state)
const step = computed(() => derived.value?.step ?? null)
const heading = computed(() => {
  const s = state.value
  if (!s) return ''
  if (s.phase === 'ended') return t('play.ended')
  return t(s.phase === 'night' ? 'play.night' : 'play.day', { n: s.round })
})
/** What the last input led to (deaths, results), so the moderator can announce it. */
const RECENT_KINDS = [
  'death',
  'idiot',
  'turned',
  'exile',
  'duel',
  'explode',
  'shoot',
  'badge',
  'sheriff',
  'end',
]
const recent = computed(() => {
  const g = game.value
  const s = state.value
  if (!g || !s || !g.events.length) return []
  const before = derive({ ...g, events: g.events.slice(0, -1) }).state.log.length
  return s.log.slice(before).filter((e) => RECENT_KINDS.includes(e.kind))
})

const submit = (event: GameEvent) => store.apply(event)

async function undo() {
  if (await confirm({ message: t('play.undoConfirm') })) await store.undo()
}

async function end(winner: Winner) {
  endOpen.value = false
  await store.end(winner)
}

const assign = (seat: number, role: RoleId) => store.apply({ step: 'assign', seat, role })
</script>

<template>
  <AppShell
    :title="game ? gameName(game) : t('app.title')"
    :back-label="t('common.back')"
    @back="router.push('/')"
  >
    <template v-if="game" #actions>
      <IconButton
        icon="i-tabler-arrow-back-up"
        :label="t('play.undo')"
        :disabled="!game.events.length"
        data-testid="undo"
        @click="undo"
      />
      <IconButton
        icon="i-tabler-users"
        :label="t('play.table')"
        data-testid="open-table"
        @click="tableOpen = true"
      />
    </template>

    <p v-if="missing" class="py-8 text-center text-comment">{{ t('detail.notFound') }}</p>
    <template v-else-if="game && state">
      <div class="flex items-center gap-2">
        <span
          :class="
            state.phase === 'night'
              ? 'i-tabler-moon text-purple'
              : state.phase === 'day'
                ? 'i-tabler-sun text-yellow'
                : 'i-tabler-flag text-green'
          "
          class="size-6"
          aria-hidden="true"
        />
        <span class="flex-1 text-lg font-bold" data-testid="phase">{{ heading }}</span>
        <UnverifiedBadge v-if="!isVerified(game.board)" />
      </div>

      <p v-if="derived?.error" class="rounded-xl bg-red/15 p-3 text-sm text-red" role="alert">
        {{ t('play.error', { index: derived.error.index + 1, message: derived.error.message }) }}
      </p>
      <p
        v-if="state.unassigned.length"
        class="rounded-xl bg-orange/15 p-3 text-sm text-orange"
        role="alert"
      >
        {{ t('play.unassigned', { roles: state.unassigned.map((r) => roleName(r)).join('、') }) }}
      </p>

      <section
        v-if="recent.length"
        class="flex flex-col gap-1 rounded-xl border border-border p-3"
        data-testid="recent"
      >
        <h3 class="text-xs text-comment">{{ t('play.recent') }}</h3>
        <p
          v-for="(e, i) in recent"
          :key="i"
          :class="e.kind === 'death' ? 'font-bold text-red' : ''"
        >
          {{ logText(e) }}
        </p>
      </section>

      <StepPanel
        v-if="step"
        :key="game.events.length"
        :step="step"
        :state="state"
        @submit="submit"
      />
      <template v-else>
        <p
          class="flex items-center justify-center gap-2 py-6 text-2xl font-bold text-green"
          data-testid="winner"
        >
          <span class="i-tabler-trophy size-8" aria-hidden="true" />{{
            t(`winners.${state.winner ?? 'none'}`)
          }}
        </p>
        <RouterLink
          :to="`/games/${game.id}`"
          class="flex h-12 items-center justify-center rounded-xl bg-purple font-bold text-bg"
          >{{ t('play.detail') }}</RouterLink
        >
      </template>

      <button
        v-if="step"
        type="button"
        class="self-center rounded-lg px-4 py-2 text-sm text-comment hover:bg-raised"
        @click="endOpen = true"
      >
        <span class="i-tabler-flag mr-1 size-4" aria-hidden="true" />{{ t('play.endGame') }}
      </button>
    </template>

    <Sheet v-model:open="tableOpen" :title="t('seats.title')">
      <SeatTable v-if="state" :state="state" editable @assign="assign" />
    </Sheet>
    <Sheet v-model:open="endOpen" :title="t('play.endGame')">
      <p>{{ t('play.endConfirm') }}</p>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="w in ['good', 'wolf', 'third', 'none'] as const"
          :key="w"
          type="button"
          class="h-12 rounded-xl bg-surface font-bold"
          @click="end(w)"
        >
          {{ t(`winners.${w}`) }}
        </button>
      </div>
    </Sheet>
  </AppShell>
</template>

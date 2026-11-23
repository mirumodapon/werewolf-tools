<script setup lang="ts">
import type { Locale } from '@werewolf/rules'
import {
  AppShell,
  IconButton,
  LocalePicker,
  ResetData,
  ScanButton,
  Segmented,
  Sheet,
  ThemePicker,
  useConfirm,
} from '@werewolf/ui'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { filterGames, type ResultFilter } from '../games/filter.ts'
import { derive, type JudgeGame } from '../games/game.ts'
import ExportSheet from '../components/ExportSheet.vue'
import { exportJson, parseBackup } from '../games/transfer.ts'
import { useGamesStore } from '../stores/games.ts'
import { useJudgeText } from '../useJudgeText.ts'
import { download } from '../download.ts'

/**
 * Every game: search, filter by result, continue or open. Each row's ⋯ button offers
 * open, a new game with the same setup, export and delete; backup is in the settings.
 */
const { t, lang, gameName, boardName, formatDate } = useJudgeText()
const router = useRouter()
const store = useGamesStore()
const settingsOpen = ref(false)
const text = ref('')
const result = ref<ResultFilter>('all')
const message = ref('')
const confirm = useConfirm()
/** The game whose ⋯ options sheet is open. */
const acting = ref<JudgeGame | null>(null)
const actionsOpen = computed({
  get: () => acting.value !== null,
  set: (open: boolean) => {
    if (!open) acting.value = null
  },
})

function open(g: JudgeGame) {
  acting.value = null
  void router.push(status(g).ongoing ? `/play/${g.id}` : `/games/${g.id}`)
}

async function duplicate(g: JudgeGame) {
  acting.value = null
  const copy = await store.duplicate(g)
  await router.push(`/play/${copy.id}`)
}

/** The game whose export sheet is open. */
const exporting = ref<JudgeGame | null>(null)
const exportOpen = computed({
  get: () => exporting.value !== null,
  set: (open: boolean) => {
    if (!open) exporting.value = null
  },
})

function exportOne(g: JudgeGame) {
  acting.value = null
  exporting.value = g
}

async function remove(g: JudgeGame) {
  acting.value = null
  const ok = await confirm({
    message: t('detail.deleteConfirm'),
    confirmLabel: t('common.delete'),
    danger: true,
  })
  if (ok) await store.remove(g.id)
}
onMounted(() => store.load())

const RESULTS: ResultFilter[] = ['all', 'ongoing', 'good', 'wolf', 'third']
const resultOptions = computed(() =>
  RESULTS.map((r) => ({ value: r, label: t(`list.results.${r}`) })),
)
const shown = computed(() =>
  filterGames(store.games, { text: text.value, result: result.value }, gameName, lang() as Locale),
)

function status(g: JudgeGame): { text: string; ongoing: boolean } {
  const { state } = derive(g)
  if (state.winner) return { text: t(`winners.${state.winner}`), ongoing: false }
  return {
    text: t('list.ongoing', {
      round: state.round,
      phase: t(`phase.${state.phase === 'night' ? 'night' : 'day'}`),
    }),
    ongoing: true,
  }
}

function exportAll() {
  download('werewolf-judge.json', exportJson(store.games))
}

async function importFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  try {
    const games = parseBackup(await file.text())
    await store.importGames(games)
    message.value = t('list.imported', { n: games.length })
  } catch (error) {
    message.value = t('list.importFailed', {
      reason: error instanceof Error ? error.message : String(error),
    })
  }
}
</script>

<template>
  <AppShell :title="t('app.title')">
    <template #actions>
      <ScanButton />
      <IconButton
        icon="i-tabler-settings"
        :label="t('common.settings')"
        @click="settingsOpen = true"
      />
    </template>
    <RouterLink
      to="/new"
      class="flex h-14 items-center justify-center gap-2 rounded-2xl bg-purple text-lg font-bold text-bg"
      data-testid="new-game"
    >
      <span class="i-tabler-plus size-6" aria-hidden="true" />{{ t('list.new') }}
    </RouterLink>
    <input
      v-model="text"
      type="search"
      :placeholder="t('list.search')"
      class="rounded-lg border border-border bg-bg px-3 py-2"
      :aria-label="t('list.search')"
    />
    <Segmented v-model="result" :options="resultOptions" :label="t('list.search')" />
    <p v-if="store.loaded && !store.games.length" class="py-8 text-center text-comment">
      {{ t('list.empty') }}
    </p>
    <p v-else-if="store.loaded && !shown.length" class="py-8 text-center text-comment">
      {{ t('list.noMatch') }}
    </p>
    <ul class="flex flex-col gap-2">
      <li v-for="g in shown" :key="g.id" class="flex items-stretch gap-1">
        <RouterLink
          :to="status(g).ongoing ? `/play/${g.id}` : `/games/${g.id}`"
          class="flex min-w-0 flex-1 flex-col gap-1 rounded-xl border border-border p-3 hover:border-purple"
          data-testid="game"
        >
          <span class="flex items-center gap-2">
            <span class="min-w-0 flex-1 truncate font-bold">{{ gameName(g) }}</span>
            <span
              class="shrink-0 text-sm whitespace-nowrap"
              :class="status(g).ongoing ? 'text-cyan' : 'text-green'"
              >{{ status(g).text }}</span
            >
          </span>
          <span class="text-sm text-comment"
            >{{ formatDate(g.createdAt) }} · {{ boardName(g.board.name) }} ·
            {{ t('common.players', { n: derive(g).state.players.length }) }}</span
          >
          <span v-if="g.note" class="truncate text-sm text-muted">{{ g.note }}</span>
        </RouterLink>
        <button
          type="button"
          class="flex w-11 shrink-0 items-center justify-center rounded-xl border border-border text-comment hover:bg-raised"
          :aria-label="t('list.more')"
          :title="t('list.more')"
          data-testid="game-more"
          @click="acting = g"
        >
          <span class="i-tabler-dots-vertical size-5" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <Sheet v-model:open="actionsOpen" :title="acting ? gameName(acting) : t('list.more')">
      <div v-if="acting" class="flex flex-col gap-2" data-testid="game-actions">
        <button type="button" class="h-12 rounded-xl bg-surface font-bold" @click="open(acting)">
          <span
            :class="status(acting).ongoing ? 'i-tabler-player-play' : 'i-tabler-file-text'"
            class="mr-1 size-5"
            aria-hidden="true"
          />{{ status(acting).ongoing ? t('detail.continue') : t('list.open') }}
        </button>
        <button
          type="button"
          class="h-12 rounded-xl bg-surface font-bold"
          @click="duplicate(acting)"
        >
          <span class="i-tabler-copy mr-1 size-5" aria-hidden="true" />{{ t('detail.duplicate') }}
        </button>
        <button
          type="button"
          class="h-12 rounded-xl bg-surface font-bold"
          @click="exportOne(acting)"
        >
          <span class="i-tabler-file-export mr-1 size-5" aria-hidden="true" />{{
            t('export.title')
          }}
        </button>
        <button
          type="button"
          class="h-12 rounded-xl border border-red font-bold text-red"
          data-testid="game-delete"
          @click="remove(acting)"
        >
          <span class="i-tabler-trash mr-1 size-5" aria-hidden="true" />{{ t('common.delete') }}
        </button>
      </div>
    </Sheet>

    <ExportSheet v-model:open="exportOpen" :game="exporting" />

    <Sheet v-model:open="settingsOpen" :title="t('common.settings')">
      <ThemePicker />
      <LocalePicker />
      <section class="flex flex-col gap-2">
        <h3 class="text-sm text-subtle">{{ t('list.backup') }}</h3>
        <button
          type="button"
          class="h-11 rounded-xl bg-surface font-bold"
          :disabled="!store.games.length"
          @click="exportAll"
        >
          <span class="i-tabler-download mr-1 size-5" aria-hidden="true" />{{ t('list.exportAll') }}
        </button>
        <label
          class="flex h-11 cursor-pointer items-center justify-center rounded-xl bg-surface font-bold"
        >
          <span class="i-tabler-upload mr-1 size-5" aria-hidden="true" />{{ t('list.importFile') }}
          <input
            type="file"
            accept="application/json,.json"
            class="sr-only"
            data-testid="import-file"
            @change="importFile"
          />
        </label>
        <p v-if="message" class="text-sm text-comment" role="status">{{ message }}</p>
      </section>
      <a href="/" class="text-sm text-blue underline"
        >{{ t('common.home') }} · {{ t('app.suite') }}</a
      >
      <ResetData />
    </Sheet>
  </AppShell>
</template>

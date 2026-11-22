<script setup lang="ts">
import type { Locale } from '@werewolf/rules'
import { AppShell, IconButton, LocalePicker, Segmented, Sheet, ThemePicker } from '@werewolf/ui'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { filterGames, type ResultFilter } from '../games/filter.ts'
import { derive, type JudgeGame } from '../games/game.ts'
import { exportJson, parseBackup } from '../games/transfer.ts'
import { useGamesStore } from '../stores/games.ts'
import { useJudgeText } from '../useJudgeText.ts'
import { download } from '../download.ts'

/** Every game: search, filter by result, continue or open; backup in the settings. */
const { t, lang, gameName, boardName, formatDate } = useJudgeText()
const router = useRouter()
const store = useGamesStore()
const settingsOpen = ref(false)
const text = ref('')
const result = ref<ResultFilter>('all')
const message = ref('')
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
      <li v-for="g in shown" :key="g.id">
        <RouterLink
          :to="status(g).ongoing ? `/play/${g.id}` : `/games/${g.id}`"
          class="flex flex-col gap-1 rounded-xl border border-border p-3 hover:border-purple"
          data-testid="game"
        >
          <span class="flex items-center gap-2">
            <span class="min-w-0 flex-1 truncate font-bold">{{ gameName(g) }}</span>
            <span class="text-sm" :class="status(g).ongoing ? 'text-cyan' : 'text-green'">{{
              status(g).text
            }}</span>
          </span>
          <span class="text-sm text-comment"
            >{{ formatDate(g.createdAt) }} · {{ boardName(g.board.name) }} ·
            {{ t('common.players', { n: derive(g).state.players.length }) }}</span
          >
          <span v-if="g.note" class="truncate text-sm text-muted">{{ g.note }}</span>
        </RouterLink>
      </li>
    </ul>

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
    </Sheet>
  </AppShell>
</template>

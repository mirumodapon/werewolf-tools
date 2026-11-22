<script setup lang="ts">
import { RoleChips } from '@werewolf/boards'
import { AppShell } from '@werewolf/ui'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Timeline from '../components/Timeline.vue'
import { derive, type JudgeGame } from '../games/game.ts'
import { decodeGame } from '../games/transfer.ts'
import { useGamesStore } from '../stores/games.ts'
import { useJudgeText } from '../useJudgeText.ts'

/** A shared game (`?s=`): preview, then save it on this device. */
const props = defineProps<{ payload?: string }>()
const { t, gameName, boardName } = useJudgeText()
const router = useRouter()
const store = useGamesStore()
const game = ref<JudgeGame | null | undefined>(undefined)
onMounted(async () => {
  try {
    game.value = props.payload ? await decodeGame(props.payload) : null
  } catch {
    game.value = null
  }
})
const state = computed(() => (game.value ? derive(game.value).state : null))

async function save() {
  if (!game.value) return
  const [saved] = await store.importGames([game.value])
  await router.replace(`/games/${saved!.id}`)
}
</script>

<template>
  <AppShell :title="t('import.title')" :back-label="t('common.back')" @back="router.replace('/')">
    <p v-if="game === null" class="py-8 text-center text-red" role="alert">
      {{ t('import.invalid') }}
    </p>
    <template v-else-if="game && state">
      <section class="flex flex-col gap-1 rounded-xl border border-border p-3">
        <p class="text-lg font-bold">{{ gameName(game) }}</p>
        <p class="text-green">
          {{ state.winner ? t(`winners.${state.winner}`) : t('detail.ongoing') }}
        </p>
        <p class="font-bold">{{ boardName(game.board.name) }}</p>
        <RoleChips :roles="game.board.roles" />
      </section>
      <Timeline :log="state.log" />
      <button
        type="button"
        class="sticky bottom-4 h-12 rounded-xl bg-purple font-bold text-bg"
        data-testid="import"
        @click="save"
      >
        <span class="i-tabler-download mr-1 size-5" aria-hidden="true" />{{ t('import.action') }}
      </button>
    </template>
  </AppShell>
</template>

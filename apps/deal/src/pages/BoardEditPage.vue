<script setup lang="ts">
import { BoardIssues, MAX_NAME_LENGTH, useBoardsStore, useBoardText } from '@werewolf/boards'
import {
  checkBoard,
  DEFAULT_RULES,
  FACTIONS,
  hasErrors,
  MAX_PLAYERS,
  playerCount,
  ROLES,
  rolesOf,
  type BoardRules,
  type RoleCounts,
  type RoleId,
} from '@werewolf/rules'
import { AppShell, BottomBar, FACTION_CLASSES, ROLE_ICONS, Stepper } from '@werewolf/ui'
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import RulesEditor from '../components/RulesEditor.vue'
import { useSettingsStore } from '../stores/settings.ts'

/** New board (`/boards/new`, `?from=<id>` to copy) or editing a custom one. */
const props = defineProps<{ id?: string; from?: string }>()
const { t, boardName, roleName } = useBoardText()
const router = useRouter()
const boards = useBoardsStore()
const settings = useSettingsStore()

const existing = props.id ? boards.customs.find((b) => b.id === props.id) : undefined
const source = existing ?? boards.byId(props.from)
const notFound = Boolean(props.id && !existing)

const name = ref(
  existing ? existing.name : source ? t('boards.copyName', { name: boardName(source.name) }) : '',
)
const note = ref(source?.note ? boardName(source.note) : '')
const roles = reactive<RoleCounts>({
  ...(source?.roles ?? { werewolf: 3, seer: 1, witch: 1, hunter: 1, villager: 2 }),
})
const rules = ref<BoardRules>({ ...(source?.rules ?? DEFAULT_RULES) })

const total = computed(() => playerCount(roles))
const issues = computed(() => checkBoard(roles))
const canSave = computed(() => name.value.trim().length > 0 && !hasErrors(issues.value))
const n = (id: RoleId) => roles[id] ?? 0
const canAdd = (id: RoleId) => total.value < MAX_PLAYERS && !(ROLES[id].unique && n(id) >= 1)

function save() {
  if (!canSave.value) return
  const id = boards.save({
    id: existing?.id,
    name: name.value,
    roles,
    rules: rules.value,
    note: note.value,
  })
  settings.playerCount = total.value
  settings.boardId = id
  void router.replace({ path: '/', query: { tab: 'boards' } })
}
</script>

<template>
  <AppShell
    :title="existing ? t('boards.editTitle') : t('boards.newTitle')"
    :back-label="t('common.back')"
    @back="router.back()"
  >
    <p v-if="notFound" class="py-8 text-center text-comment">{{ t('boards.notFound') }}</p>
    <template v-else>
      <label class="flex flex-col gap-1">
        <span class="text-sm text-subtle">{{ t('boards.name') }}</span>
        <input
          v-model="name"
          :maxlength="MAX_NAME_LENGTH"
          :placeholder="t('boards.namePlaceholder')"
          class="rounded-lg border border-border bg-bg px-3 py-2"
          data-testid="board-name"
        />
      </label>

      <section v-for="f in FACTIONS" :key="f" class="flex flex-col gap-1">
        <h2 class="text-sm font-bold" :class="FACTION_CLASSES[f].text">{{ t(`factions.${f}`) }}</h2>
        <ul class="flex flex-col divide-y divide-border rounded-xl border border-border">
          <li v-for="id in rolesOf(f)" :key="id" class="flex items-center gap-3 px-3 py-2">
            <span
              :class="[ROLE_ICONS[id], FACTION_CLASSES[f].text]"
              class="size-6 shrink-0"
              aria-hidden="true"
            />
            <span class="flex-1" :class="{ 'text-comment': !n(id) }">{{ roleName(id) }}</span>
            <Stepper
              :model-value="n(id)"
              :label="roleName(id)"
              :can-add="canAdd(id)"
              :data-testid="`role-${id}`"
              @update:model-value="(v: number) => (roles[id] = v)"
            />
          </li>
        </ul>
      </section>

      <RulesEditor v-model="rules" />

      <label class="flex flex-col gap-1">
        <span class="text-sm text-subtle">{{ t('boards.note') }}</span>
        <textarea
          v-model="note"
          rows="2"
          :placeholder="t('boards.notePlaceholder')"
          class="rounded-lg border border-border bg-bg px-3 py-2"
        />
      </label>

      <BottomBar>
        <p class="font-bold">{{ t('boards.total', { n: total }) }}</p>
        <BoardIssues :issues="issues" show-ok />
        <button
          type="button"
          class="h-12 rounded-xl bg-purple font-bold text-bg disabled:opacity-40"
          :disabled="!canSave"
          data-testid="save-board"
          @click="save"
        >
          <span class="i-tabler-device-floppy mr-1 size-5" aria-hidden="true" />{{
            t('common.save')
          }}
        </button>
      </BottomBar>
    </template>
  </AppShell>
</template>

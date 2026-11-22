<script setup lang="ts">
import { ROLE_IDS, ROLES, type GameState, type RoleId } from '@werewolf/rules'
import { FACTION_CLASSES, ROLE_ICONS, SeatPicker } from '@werewolf/ui'
import { ref } from 'vue'
import { useJudgeText } from '../useJudgeText.ts'

/** Every seat: role, alive or how they went out, sheriff and lovers. Roles can be fixed. */
const props = defineProps<{ state: GameState; editable?: boolean }>()
const emit = defineEmits<{ assign: [seat: number, role: RoleId] }>()
const { t, roleName } = useJudgeText()
const fixing = ref(false)
const fixSeat = ref<number | null>(null)
const fixRole = ref<RoleId | ''>('')

function applyFix() {
  if (fixSeat.value === null || !fixRole.value) return
  emit('assign', fixSeat.value, fixRole.value)
  fixing.value = false
  fixSeat.value = null
  fixRole.value = ''
}
const rolesInGame = () => ROLE_IDS.filter((r) => (props.state.setup.roles[r] ?? 0) > 0)
</script>

<template>
  <ul class="grid grid-cols-2 gap-2" data-testid="seat-table">
    <li
      v-for="p in state.players"
      :key="p.seat"
      class="flex items-center gap-2 rounded-xl p-2"
      :class="[
        p.role ? FACTION_CLASSES[ROLES[p.role].faction].bg : 'bg-surface',
        p.alive ? '' : 'opacity-50',
      ]"
    >
      <span
        class="w-10 shrink-0 text-right font-mono text-comment"
        :class="{ 'line-through': !p.alive }"
        >{{ t('common.seat', { n: p.seat }) }}</span
      >
      <span
        v-if="p.role"
        :class="[ROLE_ICONS[p.role], FACTION_CLASSES[ROLES[p.role].faction].text]"
        class="size-5 shrink-0"
        aria-hidden="true"
      />
      <span class="flex min-w-0 flex-col">
        <span
          class="truncate font-bold"
          :class="p.role ? FACTION_CLASSES[ROLES[p.role].faction].text : 'text-comment'"
        >
          {{ p.role ? roleName(p.role) : t('seats.unknown') }}
          <span
            v-if="state.sheriff === p.seat"
            class="i-tabler-star-filled size-3 text-yellow"
            :title="t('seats.sheriff')"
          />
          <span
            v-if="state.lovers?.includes(p.seat)"
            class="i-tabler-heart-filled size-3 text-red"
            :title="t('seats.lover')"
          />
        </span>
        <span v-if="p.death" class="truncate text-xs text-comment">{{
          t(`causes.${p.death.cause}`)
        }}</span>
      </span>
    </li>
  </ul>
  <template v-if="editable">
    <button
      v-if="!fixing"
      type="button"
      class="self-start rounded-lg bg-surface px-3 py-2 text-sm"
      @click="fixing = true"
    >
      <span class="i-tabler-pencil mr-1 size-4" aria-hidden="true" />{{ t('seats.fix') }}
    </button>
    <section v-else class="flex flex-col gap-2 rounded-xl border border-border p-3">
      <p class="text-sm text-subtle">{{ t('seats.fixHint') }}</p>
      <SeatPicker v-model="fixSeat" :count="state.players.length" :label="t('seats.fix')" />
      <select
        v-model="fixRole"
        class="rounded-lg border border-border bg-bg px-3 py-2"
        :aria-label="t('seats.fix')"
      >
        <option value="" disabled>—</option>
        <option v-for="r in rolesInGame()" :key="r" :value="r">{{ roleName(r) }}</option>
      </select>
      <button
        type="button"
        class="h-11 rounded-xl bg-purple font-bold text-bg disabled:opacity-40"
        :disabled="fixSeat === null || !fixRole"
        @click="applyFix"
      >
        {{ t('common.save') }}
      </button>
    </section>
  </template>
</template>

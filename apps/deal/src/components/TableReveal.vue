<script setup lang="ts">
import { useBoardText } from '@werewolf/boards'
import { FACTIONS, ROLE_IDS, ROLES, type SeatRole } from '@werewolf/rules'
import { FACTION_CLASSES, ROLE_ICONS, Segmented } from '@werewolf/ui'
import { computed, ref } from 'vue'
import CardBack from './CardBack.vue'

/** Every seat's role for the moderator: hidden until held; by seat or by faction. */
const props = defineProps<{ table: readonly SeatRole[] }>()
const { t, roleName } = useBoardText()
const shown = ref(false)
const view = ref<'seat' | 'faction'>('seat')
const views = computed(() => [
  { value: 'seat' as const, label: t('reveal.bySeat') },
  { value: 'faction' as const, label: t('reveal.byFaction') },
])
const bySeat = computed(() => props.table.toSorted((a, b) => a.seat - b.seat))
const byFaction = computed(() =>
  FACTIONS.map((f) => ({
    faction: f,
    seats: props.table
      .filter((s) => ROLES[s.role].faction === f)
      .toSorted((a, b) => ROLE_IDS.indexOf(a.role) - ROLE_IDS.indexOf(b.role) || a.seat - b.seat),
  })).filter((g) => g.seats.length),
)
</script>

<template>
  <CardBack
    v-if="!shown"
    :label="t('reveal.holdToShowAll')"
    icon="i-tabler-gavel"
    @reveal="shown = true"
  />
  <section v-else class="flex flex-col gap-3" data-testid="table-reveal">
    <Segmented v-model="view" :options="views" :label="t('flow.judgeView')" />
    <ul v-if="view === 'seat'" class="grid grid-cols-2 gap-2">
      <li
        v-for="s in bySeat"
        :key="s.seat"
        class="flex min-w-0 items-center gap-2 rounded-xl p-2"
        :class="FACTION_CLASSES[ROLES[s.role].faction].bg"
      >
        <span class="w-14 shrink-0 text-right font-mono whitespace-nowrap text-comment">{{
          t('common.seat', { n: s.seat })
        }}</span>
        <span
          :class="[ROLE_ICONS[s.role], FACTION_CLASSES[ROLES[s.role].faction].text]"
          class="size-5 shrink-0"
          aria-hidden="true"
        />
        <span class="font-bold" :class="FACTION_CLASSES[ROLES[s.role].faction].text">{{
          roleName(s.role)
        }}</span>
      </li>
    </ul>
    <div v-else class="flex flex-col gap-3">
      <section v-for="g in byFaction" :key="g.faction" class="flex flex-col gap-1">
        <h3 class="text-sm font-bold" :class="FACTION_CLASSES[g.faction].text">
          {{ t(`factions.${g.faction}`) }} · {{ g.seats.length }}
        </h3>
        <ul class="flex flex-wrap gap-2">
          <li
            v-for="s in g.seats"
            :key="s.seat"
            class="flex items-center gap-1 rounded-lg px-2 py-1"
            :class="[FACTION_CLASSES[g.faction].bg, FACTION_CLASSES[g.faction].text]"
          >
            <span :class="ROLE_ICONS[s.role]" class="size-4" aria-hidden="true" />
            {{ t('common.seat', { n: s.seat }) }} {{ roleName(s.role) }}
          </li>
        </ul>
      </section>
    </div>
    <button
      type="button"
      class="self-center rounded-lg px-4 py-2 text-muted hover:bg-raised"
      @click="shown = false"
    >
      <span class="i-tabler-eye-off mr-1 size-5" aria-hidden="true" />{{ t('reveal.hide') }}
    </button>
  </section>
</template>

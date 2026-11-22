<script setup lang="ts">
import { useBoardText } from '@werewolf/boards'
import { ROLES, type SeatRole } from '@werewolf/rules'
import { FACTION_CLASSES, ROLE_ICONS } from '@werewolf/ui'
import { computed } from 'vue'
import { useDoubleTap } from '../flow/useDoubleTap.ts'

/** The face-up card of the player holding the phone; a double tap anywhere turns it over. */
const props = defineProps<{ self: SeatRole }>()
const emit = defineEmits<{ cover: [] }>()
const { t, roleName } = useBoardText()
useDoubleTap(() => emit('cover'))
const def = computed(() => ROLES[props.self.role])
const colors = computed(() => FACTION_CLASSES[def.value.faction])
</script>

<template>
  <div class="no-select flex flex-col items-center gap-4">
    <div
      class="flex aspect-[3/4] w-64 flex-col items-center justify-center gap-3 rounded-3xl border-2 bg-surface p-5 text-center shadow-lg"
      :class="colors.border"
      data-testid="role-card"
    >
      <span class="text-sm text-comment">{{ t('common.seat', { n: self.seat }) }}</span>
      <span :class="[ROLE_ICONS[self.role], colors.text]" class="size-20" aria-hidden="true" />
      <span class="text-3xl font-bold" :class="colors.text">{{ roleName(self.role) }}</span>
      <span class="rounded-full px-3 py-0.5 text-sm" :class="[colors.bg, colors.text]">{{
        t(`factions.${def.faction}`)
      }}</span>
      <span class="text-sm text-muted">{{ t(`roles.${self.role}.desc`) }}</span>
    </div>
    <p class="text-muted">{{ t('flow.doubleTapToCover') }}</p>
  </div>
</template>

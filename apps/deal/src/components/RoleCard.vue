<script setup lang="ts">
import { useBoardText } from '@werewolf/boards'
import { hasVision, ROLES, visionFor, type SeatRole, type VisionMode } from '@werewolf/rules'
import { FACTION_CLASSES, ROLE_ICONS } from '@werewolf/ui'
import { computed } from 'vue'
import { useDoubleTap } from '../flow/useDoubleTap.ts'

/** The face-up card of the player holding the phone; double-tap turns it face down. */
const props = defineProps<{ self: SeatRole; table: readonly SeatRole[]; visionMode: VisionMode }>()
const emit = defineEmits<{ cover: [] }>()
const { t, roleName } = useBoardText()
const onTap = useDoubleTap(() => emit('cover'))
const def = computed(() => ROLES[props.self.role])
const colors = computed(() => FACTION_CLASSES[def.value.faction])
const seen = computed(() => visionFor(props.table, props.self.seat, props.visionMode))
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <button
      type="button"
      class="no-select flex aspect-[3/4] w-64 touch-manipulation flex-col items-center justify-center gap-3 rounded-3xl border-2 bg-surface p-5 text-center shadow-lg"
      :class="colors.border"
      data-testid="role-card"
      @click="onTap"
    >
      <span class="text-sm text-comment">{{ t('common.seat', { n: self.seat }) }}</span>
      <span :class="[ROLE_ICONS[self.role], colors.text]" class="size-20" aria-hidden="true" />
      <span class="text-3xl font-bold" :class="colors.text">{{ roleName(self.role) }}</span>
      <span class="rounded-full px-3 py-0.5 text-sm" :class="[colors.bg, colors.text]">{{
        t(`factions.${def.faction}`)
      }}</span>
      <span class="text-sm text-muted">{{ t(`roles.${self.role}.desc`) }}</span>
      <span v-if="hasVision(self.role)" class="mt-1 flex flex-col gap-1 text-sm">
        <span class="text-comment">{{ t('flow.wolves') }}</span>
        <span v-if="visionMode === 'none'" class="text-muted">{{ t('flow.wolvesNone') }}</span>
        <span v-else-if="!seen.length" class="text-muted">{{ t('flow.wolvesEmpty') }}</span>
        <span v-else class="flex flex-wrap justify-center gap-1" data-testid="vision">
          <span
            v-for="s in seen"
            :key="s.seat"
            class="rounded-md bg-wolf/15 px-2 py-0.5 font-bold text-wolf"
          >
            {{ t('common.seat', { n: s.seat })
            }}<template v-if="s.role"> · {{ roleName(s.role) }}</template>
          </span>
        </span>
      </span>
    </button>
    <p class="text-muted">{{ t('flow.doubleTapToCover') }}</p>
  </div>
</template>

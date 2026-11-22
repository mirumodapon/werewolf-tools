<script setup lang="ts">
import { HOLD_MS, useHold } from '../flow/useHold.ts'

/** A face-down card: hold to turn it over; the ring shows the progress. */
const props = defineProps<{ label: string; icon?: string }>()
const emit = defineEmits<{ reveal: [] }>()
const { holding, handlers } = useHold(() => emit('reveal'))
const R = 46
const CIRCUMFERENCE = 2 * Math.PI * R
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <button
      type="button"
      :aria-label="props.label"
      data-testid="card-back"
      class="no-select relative flex aspect-[3/4] w-60 touch-none items-center justify-center rounded-3xl border-2 border-border bg-surface shadow-lg"
      v-on="handlers"
    >
      <svg viewBox="0 0 100 100" class="absolute size-40 -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" :r="R" fill="none" stroke-width="4" stroke="var(--tn-border)" />
        <circle
          cx="50"
          cy="50"
          :r="R"
          fill="none"
          stroke-width="4"
          stroke-linecap="round"
          stroke="var(--tn-purple)"
          :stroke-dasharray="CIRCUMFERENCE"
          :style="{
            strokeDashoffset: holding ? 0 : CIRCUMFERENCE,
            transition: holding ? `stroke-dashoffset ${HOLD_MS}ms linear` : 'none',
          }"
        />
      </svg>
      <span
        :class="props.icon ?? 'i-tabler-cards'"
        class="size-16 text-purple"
        aria-hidden="true"
      />
    </button>
    <p class="text-lg text-muted">{{ props.label }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/** − value + in place of a number input. */
const model = defineModel<number>({ required: true })
const props = withDefaults(
  defineProps<{
    label: string
    min?: number
    max?: number
    size?: 'md' | 'lg'
    canAdd?: boolean
  }>(),
  { min: 0, max: Number.POSITIVE_INFINITY, size: 'md', canAdd: true },
)
const big = computed(() => props.size === 'lg')
const set = (n: number) => (model.value = Math.min(props.max, Math.max(props.min, n)))
</script>

<template>
  <div class="flex items-center gap-2" role="group" :aria-label="label">
    <button
      type="button"
      class="flex items-center justify-center rounded-full bg-surface disabled:opacity-30"
      :class="big ? 'size-12' : 'size-9'"
      :aria-label="`${label} −1`"
      :disabled="model <= min"
      @click="set(model - 1)"
    >
      <span class="i-tabler-minus" :class="big ? 'size-6' : 'size-4'" aria-hidden="true" />
    </button>
    <output
      class="text-center font-mono"
      :class="big ? 'w-14 text-3xl font-bold' : 'w-6 text-lg'"
      aria-live="polite"
      >{{ model }}</output
    >
    <button
      type="button"
      class="flex items-center justify-center rounded-full bg-surface disabled:opacity-30"
      :class="big ? 'size-12' : 'size-9'"
      :aria-label="`${label} +1`"
      :disabled="model >= max || !canAdd"
      @click="set(model + 1)"
    >
      <span class="i-tabler-plus" :class="big ? 'size-6' : 'size-4'" aria-hidden="true" />
    </button>
  </div>
</template>

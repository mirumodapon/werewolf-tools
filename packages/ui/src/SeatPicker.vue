<script setup lang="ts">
import { computed } from 'vue'

/**
 * A grid of seat numbers. Single choice (`v-model` a number or null) or several
 * (`multiple`, `v-model` an array). Out and disallowed seats are dimmed and disabled.
 */
const props = withDefaults(
  defineProps<{
    count: number
    label: string
    multiple?: boolean
    max?: number
    disabled?: readonly number[]
    dead?: readonly number[]
    marks?: Readonly<Record<number, string>>
  }>(),
  {
    multiple: false,
    max: Number.POSITIVE_INFINITY,
    disabled: () => [],
    dead: () => [],
    marks: () => ({}),
  },
)
const model = defineModel<number | null | number[]>({ required: true })
const seats = computed(() => Array.from({ length: props.count }, (_, i) => i + 1))
const selected = (n: number) =>
  Array.isArray(model.value) ? model.value.includes(n) : model.value === n

function toggle(n: number) {
  if (Array.isArray(model.value)) {
    const list = model.value
    if (list.includes(n)) model.value = list.filter((s) => s !== n)
    else if (list.length < props.max) model.value = [...list, n].toSorted((a, b) => a - b)
  } else {
    model.value = model.value === n ? null : n
  }
}
</script>

<template>
  <div
    class="grid grid-cols-5 gap-1.5"
    :role="multiple ? 'group' : 'radiogroup'"
    :aria-label="label"
  >
    <button
      v-for="n in seats"
      :key="n"
      type="button"
      :role="multiple ? 'checkbox' : 'radio'"
      :aria-checked="selected(n)"
      :disabled="disabled.includes(n) || dead.includes(n)"
      class="relative h-12 rounded-lg font-mono text-lg disabled:opacity-30"
      :class="[
        selected(n) ? 'bg-purple font-bold text-bg' : 'bg-surface',
        dead.includes(n) ? 'line-through' : '',
      ]"
      :data-testid="`seat-${n}`"
      @click="toggle(n)"
    >
      {{ n }}
      <span
        v-if="marks[n]"
        class="absolute top-0.5 right-1 text-[10px] font-normal"
        :class="selected(n) ? 'text-bg' : 'text-comment'"
        >{{ marks[n] }}</span
      >
    </button>
  </div>
</template>

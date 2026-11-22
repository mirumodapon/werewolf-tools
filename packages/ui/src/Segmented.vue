<script setup lang="ts" generic="T extends string">
/** Mutually exclusive options in a row (a radio group). */
const model = defineModel<T>({ required: true })
defineProps<{ options: readonly { value: T; label: string }[]; label: string }>()
</script>

<template>
  <div role="radiogroup" :aria-label="label" class="flex flex-wrap gap-1 rounded-xl bg-surface p-1">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="radio"
      :aria-checked="model === o.value"
      class="min-h-10 flex-1 rounded-lg px-3 text-sm"
      :class="model === o.value ? 'bg-purple font-bold text-bg' : 'text-muted hover:bg-raised'"
      @click="model = o.value"
    >
      {{ o.label }}
    </button>
  </div>
</template>

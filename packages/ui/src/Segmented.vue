<script setup lang="ts" generic="T extends string">
/** Mutually exclusive options in one row (a radio group); labels never wrap. */
const model = defineModel<T>({ required: true })
defineProps<{ options: readonly { value: T; label: string }[]; label: string }>()
</script>

<template>
  <div role="radiogroup" :aria-label="label" class="flex gap-1 rounded-xl bg-surface p-1">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="radio"
      :aria-checked="model === o.value"
      class="min-h-10 min-w-0 flex-1 rounded-lg whitespace-nowrap"
      :class="[
        // Four or more options share a phone's width: smaller text keeps each label on one line.
        options.length >= 4 ? 'px-1 text-xs' : 'px-3 text-sm',
        model === o.value ? 'bg-purple font-bold text-bg' : 'text-muted hover:bg-raised',
      ]"
      @click="model = o.value"
    >
      {{ o.label }}
    </button>
  </div>
</template>

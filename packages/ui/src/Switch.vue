<script setup lang="ts">
/** On/off switch in place of a checkbox; the whole row is the target. */
const model = defineModel<boolean>({ required: true })
defineProps<{ label: string }>()
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    class="flex min-h-12 w-full items-center gap-3 rounded-xl bg-surface px-3 text-left"
    @click="model = !model"
  >
    <span class="flex-1">{{ label }}</span>
    <span
      class="relative h-7 w-12 shrink-0 rounded-full transition-colors"
      :class="model ? 'bg-purple' : 'bg-border'"
      aria-hidden="true"
    >
      <span
        class="absolute top-1 size-5 rounded-full bg-bg transition-all"
        :class="model ? 'left-6' : 'left-1'"
      />
    </span>
  </button>
</template>

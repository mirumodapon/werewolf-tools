<script setup lang="ts">
/** Round header button: an icon with an accessible label. */
defineProps<{ icon: string; label: string }>()
</script>

<template>
  <button
    type="button"
    class="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-raised"
    :aria-label="label"
    :title="label"
  >
    <span :class="icon" class="size-6" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
/**
 * The page's main action, pinned to the bottom of the screen on a solid bar. Content above
 * scrolls normally and is never covered by a floating button. Place it last in `<AppShell>`.
 */
defineSlots<{ default(): unknown }>()
</script>

<template>
  <div
    class="sticky bottom-0 z-10 -mx-4 mt-auto -mb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col gap-2 border-t border-border bg-bg px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    data-testid="bottom-bar"
  >
    <slot />
  </div>
</template>

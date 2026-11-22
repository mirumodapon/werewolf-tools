<script setup lang="ts">
import ConfirmHost from './ConfirmHost.vue'
import UpdateGate from './UpdateGate.vue'

/** Wraps every app once: the startup update check and the shared confirm sheet. */
defineSlots<{ default(): unknown }>()
</script>

<template>
  <UpdateGate>
    <slot />
    <ConfirmHost />
  </UpdateGate>
</template>

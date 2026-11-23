<script setup lang="ts">
import { renderSVG } from 'uqr'
import { computed } from 'vue'

/** A QR code for `value`, drawn locally by uqr (unjs) as SVG: dark on white so any camera reads it. */
const props = defineProps<{ value: string; label: string }>()
const svg = computed(() =>
  props.value
    ? renderSVG(props.value, { border: 2, whiteColor: '#ffffff', blackColor: '#1a1b26' })
    : '',
)
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- SVG generated locally by uqr from our own link -->
  <div
    v-if="svg"
    class="mx-auto w-60 overflow-hidden rounded-xl"
    role="img"
    :aria-label="label"
    data-testid="qr-code"
    v-html="svg"
  />
</template>

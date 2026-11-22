<script setup lang="ts">
import { renderSVG } from 'uqr'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Sheet from './Sheet.vue'

/** A share link as text and QR code, with copy and the system share sheet. */
const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{ title: string; name: string; url: string }>()
const { t } = useI18n()
const copied = ref(false)
const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

watch(open, () => (copied.value = false))
const qr = computed(() =>
  props.url
    ? renderSVG(props.url, { border: 2, whiteColor: '#ffffff', blackColor: '#1a1b26' })
    : '',
)

async function copy() {
  await navigator.clipboard?.writeText(props.url)
  copied.value = true
}

async function share() {
  try {
    await navigator.share({ title: props.name, url: props.url })
  } catch {
    // Cancelled by the user.
  }
}
</script>

<template>
  <Sheet v-model:open="open" :title="title">
    <p v-if="!url">{{ t('common.loading') }}</p>
    <template v-else>
      <p class="font-bold">{{ name }}</p>
      <!-- eslint-disable-next-line vue/no-v-html -- SVG made locally by uqr from our own URL -->
      <div class="mx-auto w-60 overflow-hidden rounded-xl" data-testid="share-qr" v-html="qr" />
      <p class="text-center text-sm text-comment">{{ t('share.qr') }}</p>
      <input
        :value="url"
        readonly
        class="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
        :aria-label="title"
        @focus="($event.target as HTMLInputElement).select()"
      />
      <div class="flex gap-2">
        <button
          type="button"
          class="flex-1 rounded-lg bg-purple px-3 py-2 font-bold text-bg"
          @click="copy"
        >
          <span
            :class="copied ? 'i-tabler-check' : 'i-tabler-copy'"
            class="mr-1 size-5"
            aria-hidden="true"
          />{{ copied ? t('share.copied') : t('share.copyLink') }}
        </button>
        <button
          v-if="canShare"
          type="button"
          class="flex-1 rounded-lg border border-border px-3 py-2"
          @click="share"
        >
          <span class="i-tabler-share mr-1 size-5" aria-hidden="true" />{{ t('share.system') }}
        </button>
      </div>
    </template>
  </Sheet>
</template>

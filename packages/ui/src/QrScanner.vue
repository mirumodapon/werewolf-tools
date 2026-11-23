<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { createFrameReader, toolLinkTarget } from './scan.ts'
import Sheet from './Sheet.vue'

/**
 * Scans a QR code with the camera and opens it when it is one of this suite's share
 * links. Anything else is reported and scanning goes on.
 */
const open = defineModel<boolean>('open', { required: true })
const props = withDefaults(defineProps<{ go?: (url: string) => void }>(), {
  go: () => (url: string) => window.location.assign(url),
})
const { t } = useI18n()
const video = ref<HTMLVideoElement | null>(null)
const status = ref<'idle' | 'starting' | 'scanning' | 'opening' | 'denied' | 'unsupported'>('idle')
const notOurs = ref(false)
let stream: MediaStream | null = null
let timer: ReturnType<typeof setTimeout> | undefined
let running = false

function stop() {
  running = false
  clearTimeout(timer)
  for (const track of stream?.getTracks() ?? []) track.stop()
  stream = null
  if (video.value) video.value.srcObject = null
}

async function start() {
  notOurs.value = false
  if (!navigator.mediaDevices?.getUserMedia) {
    status.value = 'unsupported'
    return
  }
  status.value = 'starting'
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    })
  } catch (e) {
    status.value =
      e instanceof DOMException && e.name === 'NotAllowedError' ? 'denied' : 'unsupported'
    return
  }
  if (!open.value || !video.value) return stop()
  video.value.srcObject = stream
  await video.value.play().catch(() => {})
  const read = await createFrameReader()
  status.value = 'scanning'
  running = true
  const tick = async () => {
    if (!running || !video.value) return
    const text = await read(video.value).catch(() => null)
    if (text) {
      const target = toolLinkTarget(text, window.location.origin)
      if (target) {
        status.value = 'opening'
        stop()
        props.go(target)
        return
      }
      notOurs.value = true
    }
    timer = setTimeout(tick, 200)
  }
  void tick()
}

watch(open, (isOpen) => (isOpen ? void start() : stop()))
onBeforeUnmount(stop)
</script>

<template>
  <Sheet v-model:open="open" :title="t('scan.title')">
    <div
      class="relative mx-auto aspect-square w-full max-w-80 overflow-hidden rounded-2xl bg-black"
    >
      <video
        ref="video"
        class="size-full object-cover"
        playsinline
        muted
        data-testid="scan-video"
      />
      <div
        v-if="status === 'scanning'"
        class="pointer-events-none absolute inset-[15%] rounded-xl border-4 border-white/70"
        aria-hidden="true"
      />
    </div>
    <p
      class="text-center"
      :class="status === 'denied' || status === 'unsupported' ? 'text-red' : 'text-muted'"
      role="status"
      data-testid="scan-status"
    >
      {{ t(`scan.status.${status === 'idle' ? 'starting' : status}`) }}
    </p>
    <p
      v-if="notOurs && status === 'scanning'"
      class="text-center text-sm text-orange"
      data-testid="scan-not-ours"
    >
      {{ t('scan.notOurs') }}
    </p>
  </Sheet>
</template>

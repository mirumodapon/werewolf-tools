<script setup lang="ts">
import { shareUrl } from '@werewolf/share'
import { Segmented, Sheet } from '@werewolf/ui'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { download } from '../download.ts'
import type { JudgeGame } from '../games/game.ts'
import { renderImage } from '../games/image.ts'
import { encodeGame, exportJson, fileName, GAME_PARAM } from '../games/transfer.ts'
import { useGameExport } from '../useGameExport.ts'
import { useJudgeText } from '../useJudgeText.ts'

/** Export one game as text, JSON, an image or an import link. */
const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{ game: JudgeGame | null }>()
const { t, gameName } = useJudgeText()
const { build, text } = useGameExport()

type Format = 'text' | 'json' | 'image' | 'link'
const FORMATS: Format[] = ['text', 'json', 'image', 'link']
const format = ref<Format>('text')
const formatOptions = computed(() =>
  FORMATS.map((f) => ({ value: f, label: t(`export.formats.${f}`) })),
)
const copied = ref(false)
const link = ref('')
const image = ref<{ blob: Blob; url: string } | null>(null)
const imageError = ref(false)
const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

const name = computed(() => (props.game ? gameName(props.game) : ''))
const asText = computed(() => (props.game ? text(props.game) : ''))
const asJson = computed(() => (props.game ? exportJson(props.game) : ''))
const base = computed(() => fileName(name.value).replace(/\.json$/, ''))

function dropImage() {
  if (image.value) URL.revokeObjectURL(image.value.url)
  image.value = null
}
onBeforeUnmount(dropImage)

watch(
  () => [open.value, props.game, format.value] as const,
  async ([isOpen, game, f]) => {
    copied.value = false
    if (!isOpen || !game) return dropImage()
    if (f === 'link' && !link.value)
      link.value = shareUrl(location.href, GAME_PARAM, await encodeGame(game))
    if (f === 'image' && !image.value) {
      imageError.value = false
      try {
        const blob = await renderImage(build(game), t('export.footer'))
        image.value = { blob, url: URL.createObjectURL(blob) }
      } catch {
        imageError.value = true
      }
    }
  },
  { immediate: true },
)
watch(
  () => props.game?.id,
  () => {
    link.value = ''
    dropImage()
  },
)

async function copy(value: string) {
  await navigator.clipboard?.writeText(value)
  copied.value = true
}

async function share(data: ShareData) {
  try {
    await navigator.share(data)
  } catch {
    // Cancelled.
  }
}

function shareImage() {
  if (!image.value) return
  const file = new File([image.value.blob], `${base.value}.png`, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) void share({ files: [file], title: name.value })
  else download(`${base.value}.png`, image.value.blob)
}
</script>

<template>
  <Sheet v-model:open="open" :title="t('export.title')">
    <template v-if="game">
      <p class="font-bold">{{ name }}</p>
      <Segmented v-model="format" :options="formatOptions" :label="t('export.title')" />

      <template v-if="format === 'text' || format === 'json'">
        <textarea
          readonly
          rows="10"
          class="w-full rounded-lg border border-border bg-bg p-3 font-mono text-xs"
          :value="format === 'text' ? asText : asJson"
          :aria-label="t(`export.formats.${format}`)"
          :data-testid="`export-${format}`"
        />
        <div class="flex gap-2">
          <button
            type="button"
            class="h-11 flex-1 rounded-xl bg-purple font-bold text-bg"
            @click="copy(format === 'text' ? asText : asJson)"
          >
            <span
              :class="copied ? 'i-tabler-check' : 'i-tabler-copy'"
              class="mr-1 size-5"
              aria-hidden="true"
            />{{ copied ? t('share.copied') : t('export.copy') }}
          </button>
          <button
            type="button"
            class="h-11 flex-1 rounded-xl bg-surface font-bold"
            @click="
              format === 'text'
                ? download(`${base}.txt`, asText, 'text/plain')
                : download(`${base}.json`, asJson)
            "
          >
            <span class="i-tabler-download mr-1 size-5" aria-hidden="true" />{{
              t('export.download')
            }}
          </button>
          <button
            v-if="canShare && format === 'text'"
            type="button"
            class="h-11 flex-1 rounded-xl bg-surface font-bold"
            @click="share({ title: name, text: asText })"
          >
            <span class="i-tabler-share mr-1 size-5" aria-hidden="true" />{{ t('export.share') }}
          </button>
        </div>
      </template>

      <template v-else-if="format === 'image'">
        <p v-if="imageError" class="text-red" role="alert">{{ t('export.imageFailed') }}</p>
        <p v-else-if="!image" class="text-comment">{{ t('export.generating') }}</p>
        <template v-else>
          <img
            :src="image.url"
            :alt="name"
            class="max-h-[50dvh] w-full rounded-lg border border-border object-contain object-top"
            data-testid="export-image"
          />
          <div class="flex gap-2">
            <button
              type="button"
              class="h-11 flex-1 rounded-xl bg-purple font-bold text-bg"
              @click="download(`${base}.png`, image.blob)"
            >
              <span class="i-tabler-download mr-1 size-5" aria-hidden="true" />{{
                t('export.download')
              }}
            </button>
            <button
              v-if="canShare"
              type="button"
              class="h-11 flex-1 rounded-xl bg-surface font-bold"
              @click="shareImage"
            >
              <span class="i-tabler-share mr-1 size-5" aria-hidden="true" />{{ t('export.share') }}
            </button>
          </div>
          <p class="text-xs text-comment">{{ t('export.imageHint') }}</p>
        </template>
      </template>

      <template v-else>
        <p class="text-sm text-comment">{{ t('export.linkHint') }}</p>
        <input
          :value="link"
          readonly
          class="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          :aria-label="t('export.formats.link')"
          data-testid="export-link"
          @focus="($event.target as HTMLInputElement).select()"
        />
        <div class="flex gap-2">
          <button
            type="button"
            class="h-11 flex-1 rounded-xl bg-purple font-bold text-bg"
            :disabled="!link"
            @click="copy(link)"
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
            class="h-11 flex-1 rounded-xl bg-surface font-bold"
            :disabled="!link"
            @click="share({ title: name, url: link })"
          >
            <span class="i-tabler-share mr-1 size-5" aria-hidden="true" />{{ t('export.share') }}
          </button>
        </div>
      </template>
    </template>
  </Sheet>
</template>

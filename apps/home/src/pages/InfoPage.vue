<script setup lang="ts">
import { manifestName, pwaTools, toolById, type Locale } from '@werewolf/registry'
import { AppShell, CheckUpdate, StorageUsage } from '@werewolf/ui'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import changelog from '../../../../CHANGELOG.md?raw'
import { inlineParts, parseChangelog } from '../changelog.ts'
import { APP_VERSION } from '../version.ts'

/** Version, storage, licenses and the three newest releases (the docs keep them all). */
const { t, locale } = useI18n()
const router = useRouter()
const blocks = parseChangelog(changelog, 3)
const docs = toolById('docs').path
</script>

<template>
  <AppShell :title="t('info.title')" :back-label="t('common.back')" @back="router.push('/')">
    <section class="flex flex-col gap-1 rounded-2xl border border-border bg-raised p-4">
      <h2 class="text-sm text-subtle">{{ t('info.version') }}</h2>
      <p class="font-mono" data-testid="version">{{ APP_VERSION }}</p>
      <CheckUpdate />
    </section>

    <section class="flex flex-col gap-1 rounded-2xl border border-border bg-raised p-4">
      <h2 class="text-sm text-subtle">{{ t('info.storage') }}</h2>
      <StorageUsage />
    </section>

    <section class="flex flex-col gap-2 rounded-2xl border border-border bg-raised p-4">
      <h2 class="text-sm text-subtle">{{ t('info.changelog') }}</h2>
      <div class="flex flex-col text-sm text-muted" data-testid="changelog">
        <template v-for="(b, i) in blocks" :key="i">
          <h3 v-if="b.kind === 'version'" class="mt-3 mb-1 text-base font-bold text-fg first:mt-0">
            {{ b.text }}
          </h3>
          <h4 v-else-if="b.kind === 'section'" class="mt-2 mb-1 font-bold text-subtle">
            {{ b.text }}
          </h4>
          <p
            v-else
            class="flex gap-1.5 py-0.5"
            :style="b.kind === 'item' ? { paddingLeft: `${b.depth}rem` } : undefined"
          >
            <span v-if="b.kind === 'item'" class="text-comment" aria-hidden="true">•</span>
            <span>
              <template v-for="(part, j) in inlineParts(b.text)" :key="j">
                <code v-if="part.code" class="rounded bg-surface px-1 font-mono text-xs">{{
                  part.text
                }}</code>
                <template v-else>{{ part.text }}</template>
              </template>
            </span>
          </p>
        </template>
      </div>
      <a
        :href="`${docs}changelog`"
        target="_blank"
        rel="noopener"
        class="mt-2 flex h-11 items-center justify-center gap-1.5 rounded-xl bg-surface font-bold hover:bg-bg"
        data-testid="full-changelog"
      >
        {{ t('info.fullChangelog') }}
        <span class="i-tabler-external-link size-4" aria-hidden="true" />
      </a>
    </section>

    <section class="flex flex-col gap-2 rounded-2xl border border-border bg-raised p-4">
      <h2 class="text-sm text-subtle">{{ t('info.licenses') }}</h2>
      <p class="text-sm text-muted">{{ t('info.licensesIntro') }}</p>
      <ul class="flex flex-col gap-1 text-sm">
        <li v-for="tool in pwaTools()" :key="tool.id">
          <a
            :href="`${tool.path}licenses.txt`"
            target="_blank"
            rel="noopener"
            class="inline-flex min-h-9 items-center gap-1 text-blue hover:underline"
          >
            {{ manifestName(tool, locale as Locale) }}
            <span class="i-tabler-external-link size-4" aria-hidden="true" />
          </a>
        </li>
      </ul>
      <a :href="docs" class="inline-flex items-center gap-1 text-sm text-blue hover:underline">
        <span class="i-tabler-book size-4" aria-hidden="true" />{{ t('info.docs') }}
      </a>
      <p class="text-xs text-comment">{{ t('home.disclaimer') }}</p>
    </section>
  </AppShell>
</template>

<template>
  <div class="d-flex flex-column pa-3" :class="props.enabled ? '' : 'text-disabled'">
    <!-- display -->
    <span class="text-subtitle-1 font-weight-bold">{{ props.role }}({{ agentName }}):</span>
    <p v-html="parsedContent" class="pl-6"></p>
    <!-- image -->
    <div v-if="props.contentType == 'image_url'" class="align-self-center pt-3">
      <div v-if="props.contentImage">
        <v-img :width="240" cover :src="props.contentImage"></v-img>
      </div>
      <div v-else class="align-self-center">
        <v-icon size="240">mdi-image-off-outline</v-icon>
      </div>
    </div>
  </div>
  <!-- tool area -->
  <div class="d-flex align-center ga-2 px-2">
    <!-- enabled switch -->
    <v-switch v-model="props.enabled" :label="props.enabled ? 'Enabled' : 'Disabled'" @click.prevent="toggleEnabled"
      hide-details="auto" color="secondary" density="compact" class="pl-3 mr-auto"></v-switch>
    <!-- warning button show invalid item tooltip -->
    <v-tooltip v-if="props.invalid.length">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" variant="text" density="compact">
          <v-icon color="warning">$warning</v-icon>
        </v-btn>
      </template>
      <span>Invalid items:</span>
      <span v-for="item in props.invalid" :key="item.name" class="text-capitalize">
        <br>{{ item.name }}: {{ item.message }}
      </span>
    </v-tooltip>

    <!-- edit button -->
    <v-btn @click="$emit('editContent', props.id)" color="secondary" variant="text" density="compact">
      <v-icon>$edit</v-icon>
    </v-btn>
    <!-- delete button -->
    <v-btn @click="$emit('removeContent', props.id)" color="error" variant="text" density="compact">
      <v-icon>$delete</v-icon>
    </v-btn>
  </div>
</template>
<style>
pre {
  overflow-x: auto;
}

pre {
  border: 1px solid gray;
}

math {
  padding: 1rem;
}
</style>
<script lang="ts" setup>
import store from '@/ts/dataStore';
import { ChatContent } from '@/ts/dataStore/chatContents';
import { asyncComputed } from '@vueuse/core'
import { computedAsync } from '@vueuse/core';
import DOMPurify from 'dompurify';
import { Marked } from 'marked';
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import markedCodeFormat from 'marked-code-format';
import markedKatex from 'marked-katex-extension';

const props = defineProps<ChatContent>();
const emit = defineEmits<{
  /**
   * コンテンツを編集する画面を開く
   */
  editContent: [contentId: number],
  /**
   * コンテンツを削除する。削除して0件になる場合メッセージごと消す必要があるので親で対応してもらう必要がある
   */
  removeContent: [contentId: number]
}>();

/* 
 * エージェント
 */
const agent = asyncComputed(async () => await store.agents.get(props.agentId));
const agentName = computed(() =>
  props.agentId == -1 ? 'You' : agent.value?.name || 'Unknown');

/**
 * 有効状態を切り替える
 * 
 * propsを編集してはいけないので、click.preventでデフォルトのイベントを中止しDBを更新する
 * 親のliveQueryによって更新結果が反映される
 */
function toggleEnabled() {
  store.contents.update({ ...props, enabled: !props.enabled });
}

/*
 * sanitized Content
 */
const parsedContent = computedAsync(async () => await parseAndSanitize(props.content), "", { lazy: true });
const purify = DOMPurify(window);
const marked = new Marked()
  .use({ gfm: true })
  .use(markedKatex({ displayMode: true, output: "mathml", strict: "ignore", throwOnError: false }))
  .use(
    markedCodeFormat({
      /* Prettier options */
    })
  )
  .use(markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  }));
async function parseAndSanitize(text: string) {
  const target = text.trim()
    .replace(/\\[\[(](.+?)\\[\])]/gm, " $$$1$$ ")
    .replace(/^\\[\[(]$/gm, "$$$$")
    .replace(/^\\[\])]$/gm, "$$$$")
    .replace(/^(.+?)\n(\$\$\n.+?\n\$\$)/gm, "$1\n\n$2");
  return purify.sanitize(await marked.parse(target)).trim();
}
</script>
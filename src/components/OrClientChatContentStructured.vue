<template>
  <div>
    <v-list v-model:opened="structuredContent.open">
      <v-list-group v-for="subContent in structuredContent.subContents" :key="subContent.value">
        <template v-slot:activator="{ props }">
          <v-list-item v-bind="props" prepend-icon="mdi-account-circle" :title="subContent.title"></v-list-item>
        </template>
        <p v-html="subContent.text" class="pl-4"></p>
      </v-list-group>
    </v-list>
    <p v-html="structuredContent.remaining" class="pl-4"></p>
  </div>
</template>
<script lang="ts" setup>
import { computedAsync } from '@vueuse/core';
import { Marked } from 'marked';
import markedCodeFormat from 'marked-code-format';

const props = defineProps({
  rawContent: { type: String, required: true }
});


const structuredContent = computedAsync<{
  subContents: {
    title: string;
    value: string;
    text: string;
  }[];
  remaining: string;
  open: string[];
}>(async () => {
  if (!props.rawContent) return { subContents: [], remaining: props.rawContent, open: [] };
  const intro = extractAndRemove(props.rawContent, /<intro>(.*?)<\/intro>/s);
  intro[0] = (await marked.parse(intro[0])).trim();
  const thinking = extractAndRemove(intro[1], /<thinking>(.*?)<\/thinking>/s);
  thinking[0] = (await marked.parse(thinking[0])).trim();
  const answer = extractAndRemove(thinking[1], /<answer>(.*?)<\/answer>/s);
  answer[0] = (await marked.parse(answer[0])).trim();
  const outro = extractAndRemove(answer[1], /<outro>(.*?)<\/outro>/s);
  outro[0] = (await marked.parse(outro[0])).trim();
  const ret = {
    subContents: [
      { title: "INTRO", value: "intro", text: intro[0] },
      { title: "THINKING", value: "thinking", text: thinking[0] },
      { title: "ANSWER", value: "answer", text: answer[0] },
      { title: "OUTRO", value: "outro", text: outro[0] },
    ].filter(x => x.text),
    remaining: (await marked.parse(outro[1])).trim(),
    open: answer[0] ? ["answer"] : []
  };
  return ret;
}, { subContents: [], remaining: "", open: [] }, { lazy: true });

/**
 * retrieve and remove matched text
 * @param text target text
 * @param pattern regex pattern
 * @returns [extracted text, remaining text]
 */
function extractAndRemove(text: string, pattern: RegExp): [string, string] {
  const match = text.match(pattern);
  if (match) {
    const extracted = match[0];
    const remaining = text.replace(pattern, '');
    return [extracted, remaining];
  }
  return ['', text];
}

// sanitize
const marked = new Marked()
  .use(
    markedCodeFormat({
      /* Prettier options */
    })
  );
</script>
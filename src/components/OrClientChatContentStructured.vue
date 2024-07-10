<template>
  <div>
    <div v-for="subContent in structuredContent.subContents" :key="subContent.value">
      <!-- <v-btn :append-icon="listOpened.includes(subContent.value) ? '$collapse' : '$expand'" :text="subContent.title"
        @click="toggleList(subContent.value)" variant="text"></v-btn> -->
      <div class="cursor-pointer" @click="toggleList(subContent.value)">
        <span class="text-capitalize text-subtitle">{{ subContent.title }}</span>
        <v-icon>{{ listOpened.includes(subContent.value) ? '$collapse' : '$expand' }}</v-icon>
      </div>
      <v-expand-transition>
        <div v-show="listOpened.includes(subContent.value)" v-html="subContent.text" class="pl-6">
        </div>
      </v-expand-transition>
    </div>
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
}>(async () => {
  if (!props.rawContent) return { subContents: [], remaining: props.rawContent, open: [] };
  const intro = extractAndRemove(props.rawContent, /<llm_intro>(.*?)<\/llm_intro>/s);
  intro[0] = (await marked.parse(intro[0])).trim();
  const answer = extractAndRemove(intro[1], /<llm_answer>(.*?)<\/llm_answer>/s);
  answer[0] = (await marked.parse(answer[0])).trim();
  const outro = extractAndRemove(answer[1], /<llm_outro>(.*?)<\/llm_outro>/s);
  outro[0] = (await marked.parse(outro[0])).trim();
  const ret = {
    subContents: [
      { title: "INTRO", value: "intro", text: intro[0] },
      { title: "ANSWER", value: "answer", text: answer[0] },
      { title: "OUTRO", value: "outro", text: outro[0] },
    ].filter(x => x.text),
    remaining: (await marked.parse(outro[1])).trim()
  };
  return ret;
}, { subContents: [], remaining: "" }, { lazy: true });

const listOpened = ref<string[]>([]);
function toggleList(value: string) {
  if (listOpened.value.includes(value)) {
    listOpened.value = listOpened.value.filter(x => x !== value);
  } else {
    listOpened.value.push(value);
  }
}
watch(structuredContent, () => {
  const ret: string[] = [];
  if (structuredContent.value.subContents.map(x => x.value).includes("answer")) ret.push("answer");
  if (structuredContent.value.subContents.map(x => x.value).includes("question")) ret.push("question");
  listOpened.value = ret;
})

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
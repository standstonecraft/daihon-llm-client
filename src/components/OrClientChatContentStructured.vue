<template>
  <div>
    <div v-for="subContent in structured.subContents" :key="subContent.value">
      <!-- <v-btn :append-icon="listOpened.includes(subContent.value) ? '$collapse' : '$expand'" :text="subContent.title"
        @click="toggleList(subContent.value)" variant="text"></v-btn> -->
      <div class="cursor-pointer" @click="toggleList(subContent.value)">
        <span class="text-capitalize text-subtitle">{{ subContent.value }}</span>
        <v-icon>{{ listOpened.includes(subContent.value) ? '$collapse' : '$expand' }}</v-icon>
      </div>
      <v-expand-transition>
        <div v-show="listOpened.includes(subContent.value)" v-html="subContent.text" class="pl-6">
        </div>
      </v-expand-transition>
    </div>
    <p v-html="structured.remaining" class="pl-4"></p>
  </div>
</template>
<script lang="ts" setup>
import { computedAsync } from '@vueuse/core';
import DOMPurify from 'dompurify';
import { Marked } from 'marked';
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import markedCodeFormat from 'marked-code-format';

// sanitize
const purify = DOMPurify(window);
const marked = new Marked()
  .use({ gfm: true })
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

const props = defineProps({
  rawContent: { type: String, required: true }
});

type StructuredType = {
  subContents: {
    value: string;
    text: string;
  }[];
  remaining: string;
};
const defaultStructured: StructuredType = { subContents: [], remaining: "" };
/** tag names in response(exclude 'llm_') */
const responseTagNames = ["answer", "question", "conclusion", "outro"];
/** tag names which expansion automatically open */
const priorTagNames = ["question", "conclusion"];

/**
 * Parses the response content and extracts subContents, remaining content, and opened tag names.
 *
 * @return {Promise<{ subContents: Array<{ value: string, text: string }>, remaining: string, opened: string[] }>} An object containing the parsed subContents, remaining content, and opened tag names.
 */
const parseResponse = async () => {
  if (!props.rawContent) return { ...defaultStructured };
  let subContents = responseTagNames.map(x => ({ value: x, text: "" }));
  let remaining = props.rawContent;
  for (const obj of subContents) {
    [obj.text, remaining] = extractAndRemove(remaining, new RegExp(`<llm_${obj.value}>(.*?)</llm_${obj.value}>`, 's'));
    obj.text = purify.sanitize(await marked.parse(obj.text)).trim();
  }
  remaining = purify.sanitize(await marked.parse(remaining)).trim();
  subContents = subContents.filter(x => x.text);
  const availables = subContents.map(x => x.value);
  const opened = priorTagNames.filter(p => availables.includes(p));
  const ret = { subContents, remaining, opened };
  return ret;
};
const structured = computedAsync<StructuredType>(parseResponse, { ...defaultStructured }, { lazy: true });

const listOpened = ref<string[]>([]);
function toggleList(value: string) {
  if (listOpened.value.includes(value)) {
    listOpened.value = listOpened.value.filter(x => x !== value);
  } else {
    listOpened.value.push(value);
  }
}
watch(structured, () => {
  listOpened.value = priorTagNames.filter(x => structured.value.subContents.some(y => y.value === x));
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
    const extracted = match.length > 1 ? match[1] : match[0];
    const remaining = text.replace(pattern, '');
    return [extracted, remaining];
  }
  return ['', text];
}

</script>
<template>
  <div class="d-flex justify-end ga-2 align-center px-3 py-2">
    <!-- loader -->
    <v-progress-circular v-if="chatWaiting.length > 0" :color="waitingColor" indeterminate class="me-auto" size="28">
      <template v-slot:default> {{ chatWaiting.length || '' }}</template>
    </v-progress-circular>
    <v-progress-circular v-else model-value="0" class="me-auto" size="28"></v-progress-circular>
    <!-- title input -->
    <v-text-field v-model="chatTitle" aria-label="Title" prefix="Title:" density="compact" hide-details="auto"
      variant="plain" :class="chatTitle == 'Generating...' ? 'blink' : ''" :readonly="chatTitle == 'Generating...'">
      <template v-slot:append-inner>
        <v-icon icon="mdi-creation" @click="generateTitle" />
        <v-tooltip activator="parent" location="bottom">Generate Title</v-tooltip>
      </template>
    </v-text-field>
  </div>
</template>

<script setup lang="ts">
import store from '@/ts/dataStore';
import { askChatTitle } from '@/ts/llm';
import { injectionKeys } from './injectionSymbols';

/** inject エラーメッセージ表示 */
const showErrorDialog = inject(injectionKeys.OrClient.showErrorDialog) || (() => { throw new Error("showErrorDialogKey is not defined") });
/** inject チャット待機開始 */
const startChatWaiting = inject(injectionKeys.OrClientChat.startChatWaiting, () => { throw new Error("startChatWaitingKey is not defined") });
/** inject チャット待機停止 */
const stopChatWaiting = inject(injectionKeys.OrClientChat.stopChatWaiting, () => { throw new Error("stopChatWaitingKey is not defined") });

/** チャットID */
const chatId = defineModel<number>("chatId", { required: true, default: -1 });
const props = defineProps<{
  /** チャット待機中 stringなら待機中かつ色指定あり trueなら待機中かつ色はprimary */
  chatWaiting: string[]
}>();

/** チャット待機中の色 */
const waitingColor = computed(() => {
  if (props.chatWaiting.length > 0) {
    return props.chatWaiting.slice(-1)[0];
  }
})

/* 
 * チャットタイトル
 */
/** チャットタイトル 初期値はDBから取得 */
const chatTitle = ref<string>((await store.chats.get(chatId.value))?.title || "");
watch(props, async () => chatTitle.value = (await store.chats.get(chatId.value))?.title || "");
/** チャットタイトルが入力されたらDBに書き込む */
watch(chatTitle, (n, o) => n != o && store.chats.update(chatId.value, { title: chatTitle.value || "no title" }));

/** タイトルを生成する */
const generateTitle = async () => {
  // make loader yellow
  startChatWaiting("#ff0");
  const titleGenChatId = chatId.value;
  store.chats.update(titleGenChatId, { title: "Generating..." });
  await askChatTitle(titleGenChatId)
    .then(title => store.chats.update(titleGenChatId, { title: title || "no title" }))
    .catch(error => showErrorDialog(error.message))
    .finally(() => {
      stopChatWaiting();
    });
}
</script>
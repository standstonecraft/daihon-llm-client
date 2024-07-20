<template>
  <div class="d-flex justify-end ga-2 align-center pa-3">
    <!-- loader -->
    <v-progress-circular v-if="chatWaiting.length > 0" :color="waitingColor" indeterminate class="me-auto">
      <template v-slot:default> {{ chatWaiting.length || '' }}</template>
    </v-progress-circular>
    <v-progress-circular v-else model-value="0" class="me-auto"></v-progress-circular>
    <!-- title input -->
    <v-text-field v-model="chatTitle" label="Title" density="comfortable" hide-details="auto"
      :class="chatTitle == 'Generating...' ? 'blink' : ''" :readonly="chatTitle == 'Generating...'">
      <template v-slot:append-inner>
        <v-icon icon="mdi-creation" @click="generateTitle" />
        <v-tooltip activator="parent" location="bottom">Generate Title</v-tooltip>
      </template>
    </v-text-field>
    <!-- agent select -->
    <v-select v-model="selectedAgentIds" :items="agents" :item-props="true" multiple label="Agent" density="comfortable"
      hide-details="auto" style="max-width: 14rem;">
      <template v-slot:prepend-item>
        <v-list-item title="Select All" @click="toggleSelectAllAgent">
          <template v-slot:prepend>
            <v-checkbox-btn :indeterminate="someAgentSelected && !allAgentSelected"
              :model-value="allAgentSelected"></v-checkbox-btn>
          </template>
        </v-list-item>

        <v-divider class="mt-2"></v-divider>
      </template>
    </v-select>
    <!-- send button -->
    <v-btn @click="sendChat(chatId, selectedAgentIds)" variant="elevated" size="x-large">
      <v-icon color="primary">mdi-send</v-icon>
      <v-tooltip activator="parent" location="bottom">Send</v-tooltip>
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import store from '@/ts/dataStore';
import useLiveQuery from '@/ts/withDexie';
import { askChatTitle } from '@/ts/llm';
import { injectionKeys } from './injectionSymbols';

/** inject エラーメッセージ表示 */
const showErrorDialog = inject(injectionKeys.OrClient.showErrorDialog) || (() => { throw new Error("showErrorDialogKey is not defined") });
/** inject チャット待機開始 */
const startChatWaiting = inject(injectionKeys.OrClientChat.startChatWaiting, () => { throw new Error("startChatWaitingKey is not defined") });
/** inject チャット待機停止 */
const stopChatWaiting = inject(injectionKeys.OrClientChat.stopChatWaiting, () => { throw new Error("stopChatWaitingKey is not defined") });
/** inject チャットを送信する */
const sendChat = inject(injectionKeys.OrClientChat.sendChat) || (() => { throw new Error("sendChatKey is not defined") });

/** チャットID */
const chatId = defineModel<number>("chatId", { required: true, default: -1 });
const props = defineProps<{
  /** チャット待機中 stringなら待機中かつ色指定あり trueなら待機中かつ色はprimary */
  chatWaiting: string[]
}>();

/* 
 * エージェント選択
 */
/** 選択されたエージェントID */
const selectedAgentIds = defineModel<number[]>("selectedAgentIds", { required: true, default: [] });
/** エージェントリスト v-selectに最適な形にマッピング */
const agents = useLiveQuery(() => store.agents.getAll().toArray()
  .then(ags => ags.map(a => ({ title: a.name, value: a.id, subtitle: a.model }))) || [], []);
/** 全エージェントが選択されている */
const allAgentSelected = computed(() => {
  return selectedAgentIds.value.length === agents.value.length
});
/** 一部のエージェントが選択されている */
const someAgentSelected = computed(() => {
  return selectedAgentIds.value.length > 0
});
/** エージェント全選択/解除 */
function toggleSelectAllAgent() {
  if (allAgentSelected.value) {
    selectedAgentIds.value = [];
  } else {
    selectedAgentIds.value = agents.value.map(x => x.value);
  }
}

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
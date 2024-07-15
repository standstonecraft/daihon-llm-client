<template>
  <div class="d-flex justify-end ga-2 align-center pa-3">
    <!-- loader -->
    <v-progress-circular v-if="chatWaiting" :color="waitingColor" indeterminate class="me-auto"></v-progress-circular>
    <v-progress-circular v-if="!chatWaiting" color="primary" model-value="0" class="me-auto"></v-progress-circular>
    <!-- title input -->
    <v-text-field v-model="chatTitle" label="Title" append-inner-icon="mdi-creation" @click:append-inner="suggestTitle"
      density="comfortable" hide-details="auto"></v-text-field>
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
    <v-btn @click="sendChat(props.chatId, selectedAgentIds)" variant="elevated" size="x-large">
      <v-icon color="primary">mdi-send</v-icon>
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import store from '@/ts/dataStore';
import useLiveQuery from '@/ts/withDexie';
import { askChatTitle } from '@/ts/llm';
import { sendChatKey, startChatWaitingKey, stopChatWaitingKey } from './OrClientChat.vue';
import { showErrorDialogKey } from './OrClient.vue';

/** inject エラーメッセージ表示 */
const showErrorDialog = inject(showErrorDialogKey) || (() => { throw new Error("showErrorDialogKey is not defined") });
/** inject チャット待機開始 */
const startChatWaiting = inject(startChatWaitingKey, () => { throw new Error("startChatWaitingKey is not defined") });
/** inject チャット待機停止 */
const stopChatWaiting = inject(stopChatWaitingKey, () => { throw new Error("stopChatWaitingKey is not defined") });
/** inject チャットを送信する */
const sendChat = inject(sendChatKey) || (() => { throw new Error("sendChatKey is not defined") });

const props = defineProps<{
  /** チャットID */
  chatId: number,
  /** チャット待機中 stringなら待機中かつ色指定あり trueなら待機中かつ色はprimary */
  chatWaiting: boolean | string
}>();

/* 
 * エージェント選択
 */
/** 選択されたエージェントID */
const selectedAgentIds = defineModel<number[]>({ required: true, default: [] });
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
  if (typeof props.chatWaiting === "string") {
    return props.chatWaiting
  } else {
    return "primary"
  }
})

/* 
 * チャットタイトル
 */
/** チャットタイトル 初期値はDBから取得 */
const chatTitle = ref<string>((await store.chats.get(props.chatId))?.title || "");
watch(props, async () => chatTitle.value = (await store.chats.get(props.chatId))?.title || "");
/** チャットタイトルが入力されたらDBに書き込む */
watch(chatTitle, () => store.chats.get(props.chatId)
  .then(chat => chat && store.chats.update(chat.id, { title: chatTitle.value || "no title" })));

/** タイトルを提案する */
const suggestTitle = () => {
  // make loader yellow
  startChatWaiting("#ff0");
  askChatTitle(props.chatId)
    .then(title => store.chats.update(props.chatId, { title }))
    .catch(error => showErrorDialog(error.message))
    .finally(() => {
      stopChatWaiting();
    });
}
</script>
<template>
  <!-- sidebar -->
  <OrClientChatSidebar v-model:selectedChatId="selectedChatId" v-model:drawer="chatDrawer" />
  <v-main v-if="selectedChatId !== -1" max-height="100vh">
    <!-- message list -->
    <div class="fill-height w-100 d-flex flex-column justify-end">
      <!-- tools -->
      <OrClientChatToolbar v-model:chat-id="selectedChatId" v-model:selected-agent-ids="selectedAgentIds"
        class="flex-0-0" :chat-waiting="chatWaiting" />
      <v-divider></v-divider>
      <div class="d-flex flex-column ga-3 overflow-y-auto pa-3 flex-1-1-100">
        <div v-for="message in messages" :key="message.id">
          <OrClientChatMessage v-bind="{ chatId: selectedChatId, messageId: message.id, agentIds: selectedAgentIds }"
            v-model="newAddedContentId" />
        </div>

        <!-- スクロール用 見切れ防止のため高さにゆとり -->
        <div min-height="100px"></div>
        <!-- スクロール用 最下部要素 -->
        <div ref="listBottom">&nbsp;</div>

        <!-- floating buttons -->
        <div class="mt-auto d-flex flex-column-reverse ga-2 align-end"
          style="position: sticky; bottom: 10px; right: 30px;">
          <!-- add message button -->
          <v-btn @click="addContent" icon="$plus" color="secondary" v-tooltip="'Add Message'">
          </v-btn>
          <!-- send button -->
          <v-btn @click="sendChat(selectedChatId, selectedAgentIds)" icon="mdi-send" color="primary" v-tooltip="'Send'">
          </v-btn>
        </div>

      </div>
      <v-textarea v-model="quickField" @keyup.ctrl.enter.prevent="quickSend" placeholder="Quick Input" rows="1"
        max-rows="10" auto-grow hide-details="auto" density="compact">
        <template v-slot:prepend-inner>
          <v-icon v-tooltip="'Ctrl + Enter To Send. To attach an image, click the \'+\' button.'">$edit</v-icon>
        </template>
        <template v-slot:append-inner>
          <v-icon v-tooltip="'Quick Send'" @click="quickSend">mdi-chevron-right-circle</v-icon>
        </template>
      </v-textarea>
    </div>
  </v-main>

  <v-main v-else max-height="100vh" style="overflow-y: auto;">
    <div class="d-flex w-100 h-100 align-center justify-center">
      <span class="text-h5 text-center">Select a chat to start</span>
    </div>
  </v-main>
</template>
<script lang="ts" setup>
import store from '@/ts/dataStore';
import { ChatMessage } from '@/ts/dataStore/chatMessages';
import useLiveQuery from '@/ts/withDexie';
import OrClientChatMessage from './OrClientChatMessage.vue';
import { VBtn } from 'vuetify/components';
import { requestOpenRouter } from '@/ts/llm';
import { injectionKeys } from './injectionSymbols';

/** inject エラーメッセージ表示 */
const showErrorDialog = inject(injectionKeys.OrClient.showErrorDialog) || (() => { throw new Error("showErrorDialogKey is not defined") });

// provide
provide(injectionKeys.OrClientChat.sendChat, sendChat);
provide(injectionKeys.OrClientChat.startChatWaiting, startChatWaiting);
provide(injectionKeys.OrClientChat.stopChatWaiting, stopChatWaiting);

const chatDrawer = defineModel<boolean>({ required: true });
/** チャット選択 */
const selectedChatId = ref(-1);
/** メッセージ */
const messages = useLiveQuery<ChatMessage[]>(
  () => store.messages.getAll().where("chatId").equals(selectedChatId.value).toArray(), [selectedChatId]);
/** 選択中のエージェント */
const selectedAgentIds = ref<number[]>([]);

/*
 * チャット選択時にメッセージリスト最下部へスクロール
 */
/** 最下部要素 */
const listBottom = ref<HTMLElement>();
watch(selectedChatId, () => {
  setTimeout(() => {
    scrollToBottom();
  }, 100);
});
function scrollToBottom() {
  listBottom.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

//#region 新規メッセージ追加
/** 追加されたコンテンツのID メッセージコンポーネントで編集ダイアログを自動で開く用 */
const newAddedContentId = ref(-1);
/**
 * 新規メッセージ追加
 */
async function addContent() {
  const newMessageId = await store.messages.add({
    chatId: selectedChatId.value,
    createdAt: new Date().toISOString()
  })
  const newContentId = await store.contents.add({
    chatId: selectedChatId.value,
    messageId: newMessageId,
    agentId: -1,
    role: "user",
    contentType: "text",
    content: quickField.value ?? "",
    contentImage: "",
    enabled: true,
    createdAt: new Date().toISOString(),
    invalid: []
  });

  //sleep
  await new Promise(resolve => setTimeout(resolve, 100));

  newAddedContentId.value = newContentId;
  scrollToBottom();
}
//#endregion

//#region チャット送信と待機中状態
/** チャット待機中状態 */
const chatWaiting = ref<string[]>([]);
/** チャット送信 */
async function sendChat(chatId: number, agentIds?: number[]) {
  if (chatId < 0) {
    showErrorDialog("Please select a chat.");
    return;
  }
  if (!agentIds || agentIds.length == 0) {
    showErrorDialog("Please select one or more agent.");
    return;
  }
  const messageId = await store.messages.add({ chatId, createdAt: new Date().toISOString() });
  await Promise.all(agentIds.map(async agentId => {
    startChatWaiting(agentIds.length > 1 ? "#ad6eed" : undefined);
    try {
      await requestOpenRouter(chatId, messageId, agentId);
    } catch (error) {
      // Error 型の場合はllm.tsでメッセージ処理されている
      console.error(error);
      if (error instanceof Error) {
        showErrorDialog("unexpected error");
      }
    }
    finally {
      stopChatWaiting();
      // コンテンツをメッセージIDで検索してコンテンツが1つもなかったらメッセージを消す
      const contents = await store.contents.getAll().where("messageId").equals(messageId).toArray();
      if (contents.length == 0) {
        store.messages.remove(messageId);
      }
    }
  }));
}
/** チャット待機開始 */
function startChatWaiting(color?: string) {
  chatWaiting.value.push(color || "primary");
}
/** チャット待機停止 */
function stopChatWaiting() {
  chatWaiting.value.pop();
}
//#endregion

//#region クイック入力
const quickField = ref("");
async function quickSend() {
  if (!quickField.value) return;
  if (selectedChatId.value < 0) {
    showErrorDialog("Please select a chat.");
    return;
  }
  if (!selectedAgentIds.value || selectedAgentIds.value.length == 0) {
    showErrorDialog("Please select one or more agent.");
    return;
  }
  const newMessageId = await store.messages.add({
    chatId: selectedChatId.value,
    createdAt: new Date().toISOString()
  })
  await store.contents.add({
    chatId: selectedChatId.value,
    messageId: newMessageId,
    agentId: -1,
    role: "user",
    contentType: "text",
    content: quickField.value,
    contentImage: "",
    enabled: true,
    createdAt: new Date().toISOString(),
    invalid: []
  });
  quickField.value = "";
  setTimeout(() => {
    scrollToBottom();
  }, 100);
  await sendChat(selectedChatId.value, selectedAgentIds.value);
}
//#endregion
</script>
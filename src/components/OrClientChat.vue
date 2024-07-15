<template>
  <div class="d-flex fill-height">
    <!-- sidebar -->
    <OrClientChatSidebar v-model="selectedChatId" @chat-selected="(id: number) => selectedChatId = id" />
    <!-- message list -->
    <div v-if="selectedChatId !== -1" class="fill-height w-100 d-flex flex-column justify-end"
      style="max-width: calc(100% - 250px);">
      <!-- tools -->
      <OrClientChatToolbar :chat-id="selectedChatId" v-model="selectedAgentIds" class="flex-0-0"
        v-bind:chat-waiting="chatWaiting" />
      <v-divider></v-divider>
      <div class="d-flex flex-column ga-3 overflow-y-auto pa-3 flex-1-1">
        <div v-for="message in messages" :key="message.id">
          <OrClientChatMessage v-bind="{ chatId: selectedChatId, messageId: message.id, agentIds: selectedAgentIds }"
            v-model="newAddedContentId" />
        </div>

        <!-- add message button -->
        <v-btn v-if="selectedChatId > -1" @click="addContent" variant="elevated">
          <v-icon>$plus</v-icon>
        </v-btn>
        <!-- 最下部要素 スクロール用 見切れ防止のため高さにゆとり -->
        <div ref="listBottom" style="height: 20px;"></div>
      </div>
    </div>
    <div v-else class="d-flex w-100 align-center justify-center">
      <span class="text-h5 text-center">Select a chat to start</span>
    </div>
  </div>
</template>
<script lang="ts">
import store from '@/ts/dataStore';
import { ChatMessage } from '@/ts/dataStore/chatMessages';
import useLiveQuery from '@/ts/withDexie';
import OrClientChatMessage from './OrClientChatMessage.vue';
import { VBtn } from 'vuetify/components';
import { requestOpenRouter } from '@/ts/llm';
import { showErrorDialogKey } from './OrClient.vue';

/** InjectionKey チャットを送信する */
export const sendChatKey: InjectionKey<(chatId: number, agentIds?: number[]) => Promise<void>> = Symbol()

/**
 * InjectionKey チャット待機開始
 * @param color ローダーの色
 */
export const startChatWaitingKey: InjectionKey<(color: string | undefined) => void> = Symbol();
/**
 * InjectionKey チャット待機停止
 */
export const stopChatWaitingKey: InjectionKey<() => void> = Symbol();

</script>
<script lang="ts" setup>

/** inject エラーメッセージ表示 */
const showErrorDialog = inject(showErrorDialogKey) || (() => { throw new Error("showErrorDialogKey is not defined") });

// provide
provide(sendChatKey, sendChat);
provide(startChatWaitingKey, startChatWaiting);
provide(stopChatWaitingKey, stopChatWaiting);

/** チャット選択 */
const selectedChatId = ref(-1);
/** メッセージ */
const messages = useLiveQuery<ChatMessage[]>(
  () => store.messages.getAll().where("chatId").equals(selectedChatId.value).toArray(), [selectedChatId]);
const selectedAgentIds = ref<number[]>();

/*
 * 新規メッセージ追加
 */
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
    content: "",
    contentImage: "",
    enabled: true,
    createdAt: new Date().toISOString(),
    invalid: []
  });
  setTimeout(() => {
    newAddedContentId.value = newContentId;
  }, 100);
}

/*
 * チャット選択時にメッセージリスト最下部へスクロール
 */
/** 最下部要素 */
const listBottom = ref<HTMLElement>();
watch(selectedChatId, () => {
  setTimeout(() => {
    listBottom.value?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, 100);
});

/*
 * チャット送信と待機中状態
 */
/** チャット待機中状態 */
const chatWaiting = ref<boolean | string>(false);
/** チャット送信 */
async function sendChat(chatId: number, agentIds?: number[]) {
  if (agentIds) {
    chatWaiting.value = true;
    try {
      await requestOpenRouter(chatId, agentIds);
    } catch (error) {
      if (error instanceof Error) {
        showErrorDialog(error.message);
      } else {
        showErrorDialog("Unknown error");
      }
    }
    chatWaiting.value = false;
  } else {
    showErrorDialog("Please select an agent.");
  }
}
/** チャット待機開始 */
function startChatWaiting(): (color: string | undefined) => void {
  return (color: string | undefined) => {
    chatWaiting.value = color || "primary";
  };
}
/** チャット待機停止 */
function stopChatWaiting(): () => void {
  return () => {
    chatWaiting.value = false;
  };
}
</script>
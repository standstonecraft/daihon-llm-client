<template>
  <!-- sidebar -->
  <OrClientChatSidebar v-model:selectedChatId="selectedChatId" v-model:drawer="chatDrawer" />
  <v-main max-height="100vh" style="overflow-y: auto;">
    <!-- message list -->
    <div v-if="selectedChatId !== -1" class="fill-height w-100 d-flex flex-column justify-end">
      <!-- tools -->
      <OrClientChatToolbar v-model:chat-id="selectedChatId" v-model:selected-agent-ids="selectedAgentIds"
        class="flex-0-0" :chat-waiting="chatWaiting" />
      <v-divider></v-divider>
      <div class="d-flex flex-column ga-3 overflow-y-auto pa-3 flex-1-1">
        <div v-for="message in messages" :key="message.id">
          <OrClientChatMessage v-bind="{ chatId: selectedChatId, messageId: message.id, agentIds: selectedAgentIds }"
            v-model="newAddedContentId" />
        </div>

        <!-- 最下部要素 スクロール用 見切れ防止のため高さにゆとり -->
        <div ref="listBottom" style="height: 20px;"></div>
      </div>
      <v-divider></v-divider>
      <v-footer app color="background" class="d-flex justify-end ga-2 align-stretch px-3 pa-1">
        <!-- agent select -->
        <v-select v-model="selectedAgentIds" :items="agents" :item-props="true" multiple chips aria-label="Agent"
          prepend-icon="mdi-account-tie" variant="plain" density="compact" hide-details="auto">
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
        <!-- add message button -->
        <v-btn v-if="selectedChatId > -1" @click="addContent" variant="elevated">
          <v-icon>$plus</v-icon>
        </v-btn>
        <!-- send button -->
        <v-btn @click="sendChat(chatId, selectedAgentIds)" variant="elevated">
          <v-icon color="primary">mdi-send</v-icon>
          <v-tooltip activator="parent" location="bottom">Send</v-tooltip>
        </v-btn>
      </v-footer>
    </div>
    <div v-else class="d-flex w-100 h-100 align-center justify-center">
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

/* 
 * エージェント選択
 */
/** 選択されたエージェントID */
const selectedAgentIds = ref<number[]>([]);
/** エージェントリスト v-selectに最適な形にマッピング */
const agents = useLiveQuery(async () => (await store.agents.getAll().toArray())
  .filter(x => !x.isDeleted)
  .map(a => ({ title: a.name, value: a.id, subtitle: a.model }))
  || [], []);
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

onMounted(async () => {
  // エージェントが未選択の場合、ピン留めされたエージェントを探して選択する
  if (selectedAgentIds.value.length == 0) {
    const pinnedAgents = (await store.agents.getAll().toArray()).filter(x => x.isPinned);
    if (pinnedAgents.length > 0) {
      selectedAgentIds.value = pinnedAgents.map(x => x.id);
    }
  }
});
</script>
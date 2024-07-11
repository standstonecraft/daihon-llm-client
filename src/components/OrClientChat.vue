<template>
  <div class="d-flex fill-height">
    <!-- sidebar -->
    <OrClientChatSidebar v-model="selectedChatId" @chat-selected="(id: number) => selectedChatId = id" />
    <!-- message list -->
    <div v-if="selectedChatId !== -1" class="fill-height w-100 d-flex flex-column justify-end"
      style="max-width: calc(100% - 250px);">
      <!-- tools -->
      <OrClientChatToolbar :chat-id="selectedChatId" v-model="selectedAgentIds" class="flex-0-0" />
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
        <div ref="listBottom" style="height: 20px;"></div>
      </div>
    </div>
    <div v-else class="d-flex w-100 align-center justify-center">
      <span class="text-h5 text-center">Select a chat to start</span>
    </div>
  </div>
</template>
<script lang="ts" setup>
const selectedChatId = ref(-1);
import store from '@/ts/dataStore';
import { ChatMessage } from '@/ts/dataStore/chatMessages';
import useLiveQuery from '@/ts/withDexie';
import OrClientChatMessage from './OrClientChatMessage.vue';
import { VBtn } from 'vuetify/components';
import { requestOpenRouter } from '@/ts/llm';

const messages = useLiveQuery<ChatMessage[]>(
  () => store.messages.getAll().where("chatId").equals(selectedChatId.value).toArray(), [selectedChatId]);
const newAddedContentId = ref(-1);
const selectedAgentIds = ref<number[]>();

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

const listBottom = ref<HTMLElement>();
watch(selectedChatId, () => {
  setTimeout(() => {
    listBottom.value?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, 50);
});

const showErrorDialog = inject("showErrorDialog", (text: string) => { });
const chatWaiting = ref(false);
const sendChat = async (chatId: number, agentIds?: number[]) => {
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

};
provide("sendChat", sendChat);
provide("chatWaiting", chatWaiting);
</script>
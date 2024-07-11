<template>
  <div class="d-flex justify-end ga-2 align-center pa-3">
    <!-- loader -->
    <v-progress-circular v-if="chatWaiting" color="primary" indeterminate class="me-auto"></v-progress-circular>
    <v-progress-circular v-if="!chatWaiting" color="primary" model-value="0" class="me-auto"></v-progress-circular>
    <!-- title input -->
    <v-text-field v-model="chatTitle" label="Title" density="comfortable" hide-details="auto"></v-text-field>
    <!-- agent select -->
    <v-select v-model="agentIds" :items="agents" :item-props="true" multiple label="Agent" density="comfortable"
      hide-details="auto" style="max-width: 14rem;">
    </v-select>
    <!-- send button -->
    <v-btn @click="sendChat(props.chatId, agentIds)" variant="elevated" size="x-large">
      <v-icon color="primary">mdi-send</v-icon>
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import store from '@/ts/dataStore';
import useLiveQuery from '@/ts/withDexie';

const props = defineProps<{ chatId: number }>();
const agentIds = defineModel<number[]>();
const agents = useLiveQuery(() => store.agents.getAll().toArray()
  .then(ags => ags.map(a => ({ title: a.name, value: a.id, subtitle: a.model }))) || [], []);
const sendChat = inject("sendChat", (chatId: number, agentIds?: number[]) => { });
const chatWaiting = inject("chatWaiting", ref(false));

const chatTitle = ref<string>((await store.chats.get(props.chatId))?.title || "");
watch(chatTitle, () => store.chats.get(props.chatId)
  .then(chat => chat && store.chats.update({ ...chat, title: chatTitle.value || "no title" })));
</script>
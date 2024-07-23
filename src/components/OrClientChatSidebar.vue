<template>
  <v-navigation-drawer v-model="drawer" mobile-breakpoint="sm" :location="$vuetify.display.xs ? 'bottom' : undefined">
    <v-list-item class="py-4">
      <v-btn @click="addChat" prepend-icon="mdi-message-text" variant="outlined" color="primary">
        NEW CHAT
      </v-btn>
    </v-list-item>

    <v-list density="compact" nav>
      <v-list-item v-for="chat in chats" :key="chat.id" :value="chat.id" @click="selectChat(chat.id)"
        class="chat-sheet-item">
        <template v-slot:title>
          <span class="text-truncate">{{ chat.title }}</span>
          <v-tooltip activator="parent" location="end center" origin="top start">
            <!-- tooltip content -->
            <p>Title: {{ chat.title }}</p>
            <p>Agent: {{ chat.agentNames || 'N/A' }}</p>
            <p>Created: {{ chat.createdAt }}</p>
            <p>Updated: {{ chat.updatedAt }}</p>
            <p>Last tokens: {{ chat.lastTokenCount?.input || 'N/A' }} + {{ chat.lastTokenCount?.output || 'N/A' }} = {{
              chat.lastTokenCount?.total || 'N/A' }}</p>
          </v-tooltip>
        </template>
        <template v-slot:append>
          <v-btn @click.stop="deleteChat(chat.id)" icon="$delete" size="x-small" variant="text"
            class="chat-sheet-delete"></v-btn>
        </template>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>

</template>

<style scoped>
.chat-sheet-item .chat-sheet-delete {
  display: none;
}

.chat-sheet-item:hover .chat-sheet-delete {
  display: block;
}
</style>
<script setup lang="ts">
import { useObservable } from "@vueuse/rxjs";
import store from "@/ts/dataStore";
import { Chat } from "@/ts/dataStore/chats";
import { liveQuery } from "dexie";

const drawer = defineModel<boolean>("drawer", { required: true });

const chats = useObservable(liveQuery(() => store.chats.getAll().orderBy("id").reverse().toArray()) as any) as Ref<Chat[]>;

/**
 * チャットを追加する
 */
const addChat = async () => {
  const newChatId = await store.chats.add({
    // id: (auto increment),
    title: "Chat " + new Date().toUTCString(),
    agentNames: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }) ?? -1;
  if (newChatId < 0) {
    window.alert("Failed to create new chat.");
  }
  selectedChatId.value = newChatId;
}

/*
 * chat select
 */
/** 選択されたチャットID */
const selectedChatId = defineModel<number>("selectedChatId", { required: true });
function selectChat(id: number) {
  selectedChatId.value = id;
  drawer.value = false;
}
/** チャットを削除 */
async function deleteChat(id: number) {
  selectedChatId.value = -1;
  store.chats.remove(id);
}
</script>
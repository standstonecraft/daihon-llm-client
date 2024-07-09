<template>
  <v-sheet class="fill-height" max-width="250" max-height="100%">
    <!-- サイドバー閉じるボタン -->
    <div v-if="collapsed" style="position: relative;">
      <v-btn @click="collapsed = false" rounded="xl" style="position: absolute;left: calc(100% - 20px);top: 8px;">
        <v-icon>mdi-chevron-double-right</v-icon>
      </v-btn>
    </div>
    <!-- サイドバー -->
    <div v-if="!collapsed" class="d-flex flex-column ga-2" style="max-height: 100%;">
      <div class="pa-2" style="width: 250px;">
        <div class="d-flex justify-end">
          <v-btn @click="collapsed = true">
            <v-icon>mdi-chevron-double-left</v-icon>
          </v-btn>
        </div>
        <v-btn @click="addChat" prepend-icon="mdi-message-text" variant="outlined" color="primary">
          NEW CHAT
        </v-btn>
      </div>
      <v-divider class="border-opacity-50 mt-2"></v-divider>
      <div class="flex-1-1-100 overflow-y-scroll pl-2 pr-1">
        <v-tooltip v-for="chat in chats" :key="chat.id" location="end center" origin="top start">
          <template v-slot:activator="{ props }">
            <!-- chat sheet -->
            <v-sheet @click="selectChat(chat.id)" :color="isSelected(chat.id) ? 'surface-select' : ''"
              class="chat-sheet-item cursor-pointer d-flex flex-nowrap align-center pa-1" rounded>
              <!-- title -->
              <span v-bind="props" class="d-block text-truncate flex-1-1 py-1 me-auto">{{ chat.title }}</span>
              <!-- delete button -->
              <v-btn @click.stop="deleteChat(chat.id)" icon="$delete" size="x-small" variant="text"
                class="chat-sheet-delete"></v-btn>
            </v-sheet>
          </template>
          <!-- tooltip content -->
          <p>Title: {{ chat.title }}</p>
          <p>Agent: {{ chat.agentNames || 'N/A' }}</p>
          <p>Created: {{ chat.createdAt }}</p>
          <p>Updated: {{ chat.updatedAt }}</p>
          <p>Last tokens: {{ chat.lastTokenCount?.input || 'N/A' }} + {{ chat.lastTokenCount?.output || 'N/A' }} = {{
            chat.lastTokenCount?.total || 'N/A' }}</p>
        </v-tooltip>
      </div>
    </div>
  </v-sheet>
</template>

<style>
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

const emit = defineEmits(["chatSelected"]);

const collapsed = ref(false);
const selectedChatId = defineModel<number>({ required: true });

const chats = useObservable(liveQuery(() => store.chats.getAll().orderBy("id").reverse().toArray()) as any) as Ref<Chat[]>;

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
  selectChat(newChatId);
}

async function deleteChat(id: number) {
  selectedChatId.value = -1;
  store.chats.remove(id);
}
function selectChat(id: number) {
  selectedChatId.value = id;
  emit('chatSelected', id);
}
function isSelected(id: number) {
  return selectedChatId.value === id;
}
</script>
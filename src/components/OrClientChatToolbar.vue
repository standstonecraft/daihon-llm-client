<template>
  <div class="d-flex ga-2 align-center px-3 py-2">
    <!-- loader -->
    <v-progress-circular v-if="chatWaiting.length > 0" :color="waitingColor" indeterminate class="mr-2" size="28">
      <template v-slot:default> {{ chatWaiting.length || '' }}</template>
    </v-progress-circular>
    <v-progress-circular v-else model-value="0" class="mr-2" size="28"></v-progress-circular>
    <!-- title and agents -->
    <div class="d-flex ga-3 align-center flex-wrap">
      <!-- title input -->
      <v-text-field v-model="chatTitle" label="Title" density="compact" hide-details="auto" variant="plain"
        min-width="400" :class="chatTitle == 'Generating...' ? 'blink' : ''" :readonly="chatTitle == 'Generating...'">
        <template v-slot:append-inner>
          <v-icon icon="mdi-creation" @click="generateTitle" />
          <v-tooltip activator="parent" location="bottom">Generate Title</v-tooltip>
        </template>
      </v-text-field>
      <!-- agent select -->
      <v-select v-model="selectedAgentIds" :items="agents" :item-props="true" multiple label="Agent" variant="plain"
        min-width="400" density="compact" hide-details="auto">
        <template v-slot:prepend-item>
          <v-list-item title="Select All" @click="toggleSelectAllAgent">
            <template v-slot:prepend>
              <v-checkbox-btn :indeterminate="someAgentSelected && !allAgentSelected"
                :model-value="allAgentSelected"></v-checkbox-btn>
            </template>
          </v-list-item>
          <v-divider class="mt-2"></v-divider>
        </template>
        <template v-slot:selection="{ item, index }">
          <v-chip v-if="index < 3" class="pl-0">
            <v-avatar color="primary">
              {{ editAvaterChars(item.raw.subtitle) }}
            </v-avatar>
            <span class="ml-1">{{ item.title }}</span>
          </v-chip>
          <span v-if="index === 3" class="text-grey text-caption align-self-center">
            (+{{ selectedAgentIds.length - 3 }})
          </span>
        </template>
      </v-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import store from '@/ts/dataStore';
import { askChatTitle } from '@/ts/llm';
import { injectionKeys } from './injectionSymbols';
import useLiveQuery from "@/ts/withDexie";

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

/* 
 * エージェント選択
 */
/** 選択されたエージェントID */
const selectedAgentIds = defineModel<number[]>("selectedAgentIds", { required: true, default: [] });
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

function editAvaterChars(str: string) {
  let ret = ((str || "").split(/[-:/.]/g).map((x) => x.replace(/\d.*/g, '').substring(0, 1)).filter(x => x).join('') + "  ")
    .substring(0, 3).trim();
  return ret.toUpperCase();
}
</script>
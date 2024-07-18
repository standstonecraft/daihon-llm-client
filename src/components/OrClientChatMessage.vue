<template>
  <div v-if="contents">
    <div class="d-flex" :class="isUser ? 'justify-end' : 'justify-end flex-row-reverse'">
      <!-- flexの順番をisUserで切り替えてカミシモ振り分ける -->
      <div class="d-none d-md-block" style="min-width: 72px;">
        <!-- カミシモ用スペーサー -->
      </div>
      <!-- card -->
      <div class="flex-0-1 d-flex flex-column align-stretch" style="max-width: calc(100% - 72px);">

        <v-sheet border>
          <v-skeleton-loader v-if="contents.length == 0" type="table-heading, paragraph, actions"
            min-width="300"></v-skeleton-loader>
          <template v-if="contents.length > 1">
            <!-- buttons -->
            <div class="d-flex justify-end ga-4 px-2 pt-2 border-b-1">
              <v-btn icon="mdi-gavel" @click="synthesize" color="warning" variant="text" density="compact"
                v-tooltip="'Synthesize'">
              </v-btn>
              <v-btn icon="mdi-close" @click="removeMessage" variant="text" density="compact" v-tooltip="'Delete All'">
              </v-btn>
            </div>
            <!-- tab -->
            <v-tabs v-model="tab" center-active show-arrows>
              <v-tab v-for="(cont, index) in contents" :value="index" density="compact">
                {{ getAgentName(cont) }}
              </v-tab>
            </v-tabs>
          </template>
          <v-tabs-window v-model="tab">
            <v-tabs-window-item v-for="(cont, index) in contents" :value="`${index}`">
              <OrClientChatContent v-bind="cont" @edit-content="(contentId) => openContentEditDialog(contentId)"
                @remove-content="removeContent" />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-sheet>
      </div>
    </div>

    <!-- content edit dialog -->
    <v-dialog v-model="contentEditDialog" class="w-75">
      <OrClientChatContentEdit :content-id="editingContentId" @close="closeContentEditDialog"
        @send="sendChat(props.chatId, props.agentIds)" />
    </v-dialog>
  </div>
</template>
<script lang="ts" setup>
import useLiveQuery from '@/ts/withDexie';
import store from '@/ts/dataStore';
import { Agent } from '@/ts/dataStore/agents';
import { ChatContent } from '@/ts/dataStore/chatContents';
import { injectionKeys } from './injectionSymbols';

/** inject チャットを送信する */
const sendChat = inject(injectionKeys.OrClientChat.sendChat) || (() => { throw new Error("sendChatKey is not defined") });

const props = defineProps<{ chatId: number, messageId: number, agentIds: number[] | undefined }>();
const tab = ref(0);

const computedMessageId = computed(() => props.messageId);
const contents = useLiveQuery<ChatContent[]>(
  () => store.contents.getAll().where("messageId").equals(computedMessageId.value).toArray() || [], [computedMessageId]);

const isUser = computed(() => contents.value[0]?.role == "user");

const agentDic = useLiveQuery<Map<number, Agent>>(() =>
  store.agents.getAll().toArray().then(arr =>
    new Map<number, Agent>(arr.map(agent => [agent.id, agent]) ?? [])), []);
/**
 * エージェント名を取得
 */
function getAgentName(content: ChatContent) {
  const agentName = agentDic.value?.get(content.agentId)?.name;
  switch (content.role) {
    case 'user':
      return `You`;
    default:
      return agentName;
  }
}

/** コンテンツを削除する */
async function removeContent(contentId: number) {
  const becomeEmptyMessage = contents.value.length == 1;
  await store.contents.remove(contentId);
  if (becomeEmptyMessage) {
    await store.messages.remove(props.messageId);
  }
  tab.value = 0;
}
/** メッセージを削除する */
function removeMessage() {
  store.messages.remove(props.messageId);
  [...contents.value].forEach(content => store.contents.remove(content.id));
}

/**
 * 意見集約を指示するメッセージを追加する
 */
function synthesize() {
  store.messages.add({
    chatId: props.chatId,
    createdAt: new Date().toISOString(),
  })
    .then(newMessageId => store.contents.add({
      chatId: props.chatId,
      messageId: newMessageId,
      agentId: -1,
      role: "user",
      content: `${contents.value.length}人の回答を統合して最終的な回答を出してください。`,
      contentType: "text",
      contentImage: "",
      createdAt: new Date().toISOString(),
      enabled: true,
      invalid: []
    }));
}

/*
 * エディタの開閉
 */
/** 編集中コンテンツID */
const editingContentId = ref(-1);
/** エディタの開閉 */
const contentEditDialog = ref(false);
/** エディタを開く */
function openContentEditDialog(contentId: number) {
  contentEditDialog.value = true;
  editingContentId.value = contentId;
}
/** エディタを閉じる */
function closeContentEditDialog() {
  contentEditDialog.value = false;
  editingContentId.value = -1;
}

/*
 * 追加されたコンテンツ エディタ自動オープン用
 */
/** 追加されたコンテンツのID 編集ダイアログを自動で開く用 */
const newAddedContentId = defineModel<number>({ required: true });
/* 追加された */
watch(newAddedContentId, () => {
  if (contents.value && newAddedContentId.value == contents.value[0]?.id) {
    openContentEditDialog(newAddedContentId.value);
  }
});
</script>
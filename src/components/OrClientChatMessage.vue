<template>
  <div v-if="contents">
    <div class="d-flex" :class="isUser ? 'justify-end' : 'justify-end flex-row-reverse'">
      <!-- flexの順番をisUserで切り替えてカミシモ振り分ける -->
      <div class="d-none d-md-block" style="min-width: 72px;">
        <!-- カミシモ用スペーサー -->
      </div>
      <!-- card -->
      <v-sheet class="flex-0-1" border style="max-width: calc(100% - 72px);">
        <v-tabs v-model="tab" v-if="contents.length > 1">
          <v-tab v-for="(cont, index) in contents" :value="index" density="compact">
            {{ getAgentName(cont) }}
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="tab">
          <v-tabs-window-item v-for="(cont, index) in contents" :value="`${index}`">
            <OrClientChatContent v-bind="cont" @edit-content="(contentId) => openContentEditDialog(contentId)"
              @remove-content="removeContent" />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-sheet>
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

const newAddedContentId = defineModel<number>({ required: true });
const props = defineProps<{ chatId: number, messageId: number, agentIds: number[] | undefined }>();
const sendChat = inject("sendChat", (chatId: number, agentIds?: number[]) => { });
const tab = ref("0");

const computedMessageId = computed(() => props.messageId);
const contents = useLiveQuery<ChatContent[]>(
  () => store.contents.getAll().where("messageId").equals(computedMessageId.value).toArray() || [], [computedMessageId]);

const isUser = computed(() => contents.value[0]?.role == "user");
const agents = useLiveQuery<Agent[]>(() => store.agents.getAll().toArray() || [], []);
const agentDic = computed(() => new Map(agents.value?.map(agent => [agent.id, agent]) ?? []));
/**
 * エージェント名を取得
 */
function getAgentName(content: ChatContent) {
  const agentName = agentDic.value.get(content.agentId)?.name;
  switch (content.role) {
    case 'user':
      return `You`;
    default:
      return agentName;
  }
}

async function removeContent(contentId: number) {
  const becomeEmptyMessage = contents.value.length == 1;
  await store.contents.remove(contentId);
  if (becomeEmptyMessage) {
    await store.messages.remove(props.messageId);
  }
}

// content editor
const editingContentId = ref(-1);
const contentEditDialog = ref(false);
function openContentEditDialog(contentId: number) {
  contentEditDialog.value = true;
  editingContentId.value = contentId;
}
function closeContentEditDialog() {
  contentEditDialog.value = false;
  editingContentId.value = -1;
}
watch(newAddedContentId, () => {
  if (contents.value && newAddedContentId.value == contents.value[0]?.id) {
    openContentEditDialog(newAddedContentId.value);
  }
});
/*
export type ChatContent = {
  id: number;
  chatId: number;
  messageId: number;
  agentId: number;
  content: ChatCompletionMessageParam;
  createdAt: string;
}

export interface ChatCompletionSystemMessageParam {
  content: string;
  role: 'system';
  name?: string;
}

export interface ChatCompletionAssistantMessageParam {
  content?: string | null;
  role: 'assistant';
  name?: string;
  function_call?: ChatCompletionAssistantMessageParam.FunctionCall | null;
  tool_calls?: Array<ChatCompletionMessageToolCall>;
}
export interface ChatCompletionUserMessageParam {
  content: string | Array<ChatCompletionContentPart>;
  role: 'user';
  name?: string;
}
export interface ChatCompletionContentPartText {
  text: string;
  type: 'text';
}
export interface ChatCompletionContentPartImage {
  image_url: ChatCompletionContentPartImage.ImageURL;
  type: 'image_url';
}
export namespace ChatCompletionContentPartImage {
  export interface ImageURL {
    url: string;
    detail?: 'auto' | 'low' | 'high';
  }
}
  */

</script>
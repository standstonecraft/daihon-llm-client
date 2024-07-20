<template>
  <v-sheet class="d-flex flex-column flex-sm-row">
    <!-- inputs column -->
    <div class="d-flex flex-column flex-1-0 pa-3" min-width="500">
      <!-- role / type / image / agent row -->
      <div class="d-flex ga-2 flex-wrap align-center">
        <!-- role select -->
        <v-select v-model="inputs.role" :items="roles" label="Role" density="comfortable" hide-details="auto"
          class="flex-0-1" style="min-width: 10rem;"></v-select>
        <!-- contentType select -->
        <v-switch v-show="inputs.role == 'user'" v-model="inputs.contentType"
          :label="`${inputs.contentType == 'image_url' ? 'Image' : 'Text'}`" false-value="text" true-value="image_url"
          hide-details></v-switch>
        <!-- image -->
        <div v-if="inputs.contentType == 'image_url'">
          <ImagePicker v-model="inputs.contentImage" v-bind:image-size="58"></ImagePicker>
        </div>
        <!-- user / agent select -->
        <v-select v-model="inputs.agentId" :items="agentList" item-title="name" item-value="id"
          v-show="inputs.role == 'assistant'" label="Agent" density="comfortable" hide-details="auto" class="flex-1-0">
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props" :subtitle="item.raw.model"></v-list-item>
          </template>
        </v-select>
      </div>
      <!-- content input row -->
      <v-textarea ref="content" label="Content" v-model="inputs.content" @keyup.ctrl.enter="saveAndSend" rows="1"
        auto-grow hide-details="auto" density="comfortable" class="mt-3"></v-textarea>
      <!-- tool row -->
      <div class="d-flex mt-3 align-center ga-2 flex-wrap">
        <!-- enabled switch -->
        <v-switch v-model="inputs.enabled" :label="inputs.enabled ? 'Enabled' : 'Disabled'" hide-details="auto"
          density="comfortable" class="pl-3 mr-auto"
          v-tooltip="'If disabled, this content will not be sent'"></v-switch>
        <!-- send button -->
        <v-btn @click="saveAndSend" variant="text" density="comfortable" color="primary" v-tooltip="'Send'">
          <v-icon>mdi-send</v-icon>
        </v-btn>
        <!-- complete button -->
        <v-btn @click="save" variant="text" density="comfortable" color="secondary" v-tooltip="'Save'">
          <v-icon>$complete</v-icon>
        </v-btn>
        <!-- cancel button -->
        <v-btn @click="cancel" variant="text" density="comfortable" color="error" v-tooltip="'Cancel'">
          <v-icon>$cancel</v-icon>
        </v-btn>
      </div>
    </div>
    <v-divider :vertical="$vuetify.display.smAndUp"></v-divider>
    <!-- presets column -->
    <v-list class="flex-1-0 flex-sm-0-1 overflow-y-auto" :max-width="$vuetify.display.smAndUp ? '250' : ''">
      <v-list-item>
        <v-list-item-title class="text-h6">Presets</v-list-item-title>
      </v-list-item>
      <v-list-item v-for="preset in presets" :key="preset.id" @click="insertPreset(preset.prompt)" :title="preset.name"
        :subtitle="preset.prompt"></v-list-item>
    </v-list>
  </v-sheet>
</template>
<script lang="ts" setup>
import store from '@/ts/dataStore';
import { Agent } from '@/ts/dataStore/agents';
import { ChatContent } from '@/ts/dataStore/chatContents';
import { PresetPrompt } from '@/ts/dataStore/presetPrompts';
import useLiveQuery from '@/ts/withDexie';

// 親から渡されるデータ
const props = defineProps<{ contentId: number }>();
// 入力用データ
const inputs = reactive<ChatContent>(await store.contents.get(props.contentId) || {} as ChatContent);
// 入力要素
const content = ref<HTMLTextAreaElement | null>();

const emit = defineEmits<{
  /** クローズ要求 */
  close: [],
  /** 送信要求 */
  send: []
}>();
const agents = useLiveQuery<Agent[]>(() => store.agents.getAll().toArray() || [], []);
const agentList = computed(() => [{ id: -1, name: "You" } as Agent, ...agents.value ?? []]);
const roles = ["user", "system", "assistant"];

/** プリセットリスト ソート順でソート済み */
const presetsQuery = useLiveQuery<PresetPrompt[]>(async () => ((await store.presetPrompts.getAll()).orderBy("sortIndex")).toArray() || [], []);
const presets = computed(() => presetsQuery.value);
function insertPreset(prompt: string) {
  inputs.content = inputs.content + "\n" + prompt;
}

/** 保存 */
function save() {
  if (inputs.role != "assistant") {
    // アシスタントでないときagentIdを破棄
    inputs.agentId = -1;
  }
  if (inputs.contentType == "text") {
    // テキストのときcontentImageを破棄
    inputs.contentImage = "";
  }
  store.contents.update(inputs);
  emit('close');
}

function saveAndSend() {
  save();
  emit('send');
}

/** キャンセル */
function cancel() {
  emit('close');
}

onMounted(() => {
  // 入力要素のフォーカス
  content.value?.focus();
  // 有効なプリセットをコンテンツに挿入
  const presetInterval = setInterval(() => {
    const presetsLoaded = presetsQuery.value.length > 0;
    const contentEmpty = inputs.content.length == 0;
    if (presetsLoaded && contentEmpty) {
      inputs.content = presetsQuery.value.filter(p => p.isOn).map(p => p.prompt).join("\n");
      clearInterval(presetInterval);
    }
  }, 100);
});
</script>
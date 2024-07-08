<template>
  <v-sheet class="d-flex flex-column pa-3">
    <div class="d-flex ga-2 flex-wrap">
      <!-- role select -->
      <v-select v-model="inputs.role" :items="roles" label="Role" density="comfortable" hide-details="auto"
        class="flex-0-1" style="min-width: 10rem;"></v-select>
      <!-- user / agent select -->
      <v-select v-model="inputs.agentId" :items="agentList" item-title="name" item-value="id"
        v-show="inputs.role != 'user'" label="Agent" density="comfortable" hide-details="auto" class="flex-1-0">
        <template v-slot:item="{ props, item }">
          <v-list-item v-bind="props" :subtitle="item.raw.model"></v-list-item>
        </template>
      </v-select>
    </div>
    <!-- contentType select -->
    <v-select v-model="inputs.contentType" :items="contentTypes" label="ContentType" density="comfortable"
      hide-details="auto" class="flex-0-1 mt-3" style="min-width: 10rem;"></v-select>
    <!-- content input -->
    <v-textarea label="Content" v-model="inputs.content" @keyup.ctrl.enter="saveAndSend" rows="1" auto-grow
      hide-details="auto" density="comfortable" class="mt-3"></v-textarea>
    <div v-if="inputs.contentType == 'image_url'">
      <div v-if="inputs.contentImage">
        <v-img :width="60" cover :src="inputs.contentImage"></v-img>
      </div>
      <div v-else class="align-self-center">
        <v-icon size="60">mdi-image-off-outline</v-icon>
      </div>
    </div>
    <!-- tool area -->
    <div class="d-flex mt-3 align-center ga-2 flex-wrap">
      <!-- enabled switch -->
      <v-switch v-model="inputs.enabled" :label="inputs.enabled ? 'Enabled' : 'Disabled'" hide-details="auto"
        density="comfortable" class="pl-3 mr-auto"></v-switch>
      <!-- send button -->
      <v-btn @click="saveAndSend" variant="text" density="comfortable" color="primary">
        <v-icon>mdi-send</v-icon>
      </v-btn>
      <!-- complete button -->
      <v-btn @click="save" variant="text" density="comfortable" color="secondary">
        <v-icon>$complete</v-icon>
      </v-btn>
      <!-- cancel button -->
      <v-btn @click="cancel" variant="text" density="comfortable" color="error">
        <v-icon>$cancel</v-icon>
      </v-btn>
    </div>
  </v-sheet>
</template>
<script lang="ts" setup>
import store from '@/ts/dataStore';
import { Agent } from '@/ts/dataStore/agents';
import { ChatContent } from '@/ts/dataStore/chatContents';
import useLiveQuery from '@/ts/withDexie';

/** 親から渡されるデータ */
const props = defineProps<{ contentId: number }>();
/** 入力用データ */
const inputs = reactive<ChatContent>(await store.contents.get(props.contentId) || {} as ChatContent);

const emit = defineEmits<{
  /** クローズ要求 */
  close: [],
  /** 送信要求 */
  send: []
}>();
const agents = useLiveQuery<Agent[]>(() => store.agents.getAll().toArray() || [], []);
const agentList = computed(() => [{ id: -1, name: "You" } as Agent, ...agents.value ?? []]);
const roles = ["user", "system", "assistant"];
const contentTypes = ["text", "image"];

/** 保存 */
function save() {
  if (inputs.role == "user") {
    inputs.agentId = -1;
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

</script>
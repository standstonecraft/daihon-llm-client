<template>

  <v-sheet border class="d-flex flex-column">
    <div class="pa-4">
      <h3>API</h3>
      <div class="pt-2 pl-4 d-flex flex-column ga-2">
        <p>The OpenRouter API key.</p>
        <v-text-field v-model="apiKey" label="API Key"
          placeholder="xx-xx-xx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          hide-details></v-text-field>
      </div>
      <div class="pt-2 pl-4 d-flex ga-4 align-center">
        <span>Streaming: </span>
        <v-switch v-model="streaming" :label="streaming ? 'ON' : 'OFF'" density="compact" hide-details></v-switch>
      </div>
    </div>
    <v-divider></v-divider>
    <div class="pa-4">
      <h3>Common Propmpt</h3>
      <div class="pt-2 pl-4 d-flex flex-column ga-2">
        <p>The prompt that will be used at the top of each chat by all agents.</p>
        <v-textarea v-model="commonPrompt" label="Common Prompt"></v-textarea>
      </div>
    </div>
    <v-divider></v-divider>
    <div class="pa-4">
      <h3>Prompt Presets</h3>
      <div class="pt-2 pl-4 d-flex flex-column ga-2">
        <p>Register frequently used prompts.</p>
        <div class="d-flex ga-2">
          <v-list max-width="350" max-height="300" class="overflow-y-auto">
            <draggable v-model="presetPrompts" group="pp" item-key="id" handle=".draggable-handle"
              @change="onListOrdered">
              <template #item="{ element }">
                <v-list-item :title="element.name" @click="editingPresetId = element.id"
                  :isactive="editingPresetId === element.id" :variant="editingPresetId === element.id ? 'tonal' : null"
                  class="customPrepend">
                  <template v-slot:prepend>
                    <v-icon class="draggable-handle cursor-grab" size="small">mdi-drag-horizontal-variant</v-icon>
                  </template>
                  <template v-slot:subtitle>
                    <span class="text-caption">{{ element.prompt }}</span>
                  </template>
                  <!-- デフォルトオンチェックボックス -->
                  <template v-slot:append>
                    <v-checkbox-btn :model-value="element.isOn" @click="togglePresetIsOn(element.id)"
                      v-tooltip="`On/Off by Default`"></v-checkbox-btn>
                  </template>
                </v-list-item>
              </template>
            </draggable>
          </v-list>
          <div class="flex-1-1 d-flex flex-column ga-2">
            <v-textarea v-model="inputPresetPrompt" label="Prompt" rows="8" counter></v-textarea>
            <div class="d-flex ga-2 justify-end">
              <v-btn @click="addPresetPrompt" prepend-icon="$plus" variant="text" color="primary">
                ADD
              </v-btn>
              <v-btn @click="deletePresetPrompt(editingPresetId)" prepend-icon="$delete" variant="text" color="error">
                DELETE
              </v-btn>
            </div>
          </div>
        </div>
      </div>
    </div>
    <v-divider></v-divider>
    <div class="pa-4">
      <h3>Chat Title Generation</h3>
      <div class="pt-2 pl-4 d-flex flex-column ga-2">
        <p>AI choose the title of the chat when you click the <v-icon>mdi-creation</v-icon> button in the chat title
          field.</p>
        <v-text-field v-model="titleGenerationModel" label="Model Name" placeholder="anthropic/claude-3-haiku"
          hide-details type="text"></v-text-field>
      </div>
    </div>
    <v-divider></v-divider>
    <div class="pa-4">
      <h3>Profile</h3>
      <div class="pt-2 pl-4 d-flex flex-column ga-2">
        <div class="d-flex ga-4">
          <v-btn @click="store.upload" prepend-icon="mdi-upload" variant="text" color="primary">
            UPLOAD
          </v-btn>
          <v-btn @click="store.download" prepend-icon="mdi-upload" variant="text" color="primary">
            DOWNLOAD
          </v-btn>
          <v-btn @click="deleteProfile" prepend-icon="$delete" variant="outlined" color="error">
            DELETE
          </v-btn>
        </div>
      </div>
    </div>
  </v-sheet>
</template>
<style scoped>
.customPrepend :deep(.v-list-item__prepend .v-list-item__spacer) {
  width: 0.5rem;
}
</style>
<script lang="ts" setup>
import store from '@/ts/dataStore'
import { PresetPrompt } from '@/ts/dataStore/presetPrompts';
import useLiveQuery from '@/ts/withDexie';
import draggable from 'vuedraggable'

const apiKey = ref<string | undefined>("");
watch(apiKey, (n) => {
  store.config.update({ apiKey: n || "" });
});

const commonPrompt = ref<string | undefined>("");
watch(commonPrompt, (n) => {
  store.config.update({ commonPrompt: n || "" });
});

const titleGenerationModel = ref<string | undefined>("");
watch(titleGenerationModel, (n) => {
  store.config.update({ titleGenerationModel: n || "" });
});

const streaming = ref(false);
watch(streaming, (n) => {
  store.config.update({ streaming: n });
});

const presetPromptsQuery = useLiveQuery<PresetPrompt[]>(async () => (await store.presetPrompts.getAll()).orderBy("sortIndex").toArray() || [], []);
const presetPrompts = ref<PresetPrompt[]>([]);
watch(presetPromptsQuery, (n) => {
  presetPrompts.value = n;
});
const editingPresetId = ref(-1);
const editingPreset = computed(() => presetPrompts.value?.find(p => p.id === editingPresetId.value));
const editingPresetSwitching = ref(false);
watch(editingPreset, (n) => {
  editingPresetSwitching.value = true;
  if (n) {
    inputPresetPrompt.value = n.prompt;
  } else {
    inputPresetPrompt.value = "";
  }
  // editingPresetPrompt への伝播を済ませるために nextTick() で待つ
  nextTick(() => editingPresetSwitching.value = false);
});
/** プリセットテキストエリア */
const inputPresetPrompt = ref("");
watch(inputPresetPrompt, (n) => {
  // 選択によってeditingPresetIdが変わった場合は変更とみなさない
  if (editingPresetSwitching.value) return;
  store.presetPrompts.update(editingPresetId.value, { prompt: n });
});
async function togglePresetIsOn(id: number) {
  store.presetPrompts.update(id, { isOn: !(await store.presetPrompts.get(id))?.isOn });
}
function addPresetPrompt() {
  store.presetPrompts.add();
}
function deletePresetPrompt(id: number) {
  if (id > -1) {
    store.presetPrompts.remove(id);
  }
}
function onListOrdered() {
  presetPrompts.value.forEach((p, i) => store.presetPrompts.update(p.id, { sortIndex: i }));
}

function deleteProfile() {
  window.confirm("Are you sure to delete the profile?") && store.reset();
}

onMounted(() => {
  store.config.get().then(c => {
    apiKey.value = c.apiKey;
    commonPrompt.value = c.commonPrompt;
    titleGenerationModel.value = c.titleGenerationModel;
  });
});
</script>
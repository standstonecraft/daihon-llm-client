<template>
  <v-sheet border :width="500" class="d-flex pa-2">
    <!-- 画像 -->
    <div class="pt-4">
      <ImagePicker v-model="inputs.image" v-bind:image-size="58"></ImagePicker>
    </div>
    <div class="flex-1-1 d-flex flex-column pa-2">
      <v-text-field label="Name" v-model="inputs.name" clearable density="compact" class="mt-3"></v-text-field>
      <v-text-field label="Model" v-model="inputs.model" clearable density="compact"></v-text-field>
      <v-textarea label="System Prompt" v-model="inputs.systemPrompt" density="compact" row-height="20" rows="3"
        auto-grow class="">
      </v-textarea>
      <div class="d-flex justify-end ga-2">
        <v-btn @click="store.agents.pin(inputs.id)" :text="inputs.isPinned ? 'PINNED' : 'PIN'"
          :prepend-icon="inputs.isPinned ? 'mdi-pin' : 'mdi-pin-outline'" :active="inputs.isPinned" variant="text"
          color="secondary">
        </v-btn>
        <v-btn @click="store.agents.remove(inputs.id)" prepend-icon="$delete" variant="text" color="error">
          DELETE
        </v-btn>
      </div>
    </div>
  </v-sheet>
</template>
<script setup lang="ts">
import store from "@/ts/dataStore";
import { type Agent } from "@/ts/dataStore/agents";

const props = defineProps<Agent>();

/*
 * 入力要素
 * 更新されたらデータベースに反映→propsに反映される
 */
const inputs = reactive<Agent>({ ...props });
watch(inputs, ((n) => store.agents.update(n.id, n)));
watch(props, ((n) => Object.assign(inputs, n)));
</script>
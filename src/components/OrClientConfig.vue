<template>

  <v-sheet border class="d-flex flex-column">
    <div class="pa-4">
      <h3>API Key</h3>
      <div class="pt-2 pl-4 d-flex flex-column ga-2">
        <v-text-field v-model="apiKey" label="API Key" hint="Enter OpenRouter API key."></v-text-field>
      </div>
    </div>
    <v-divider></v-divider>
    <div class="pa-4">
      <h3>Common Propmpt</h3>
      <div class="pt-2 pl-4 d-flex flex-column ga-2">
        <p>The prompt that will be used at the top of each chat by all agents.</p>
        <v-textarea v-model="commonPrompt" label="Common Prompt"></v-textarea>
        <div>
          <v-btn @click="resetCommonPrompt" prepend-icon="mdi-refresh" variant="text" color="error">
            RESET
          </v-btn>
        </div>
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

<script lang="ts" setup>
import store from '@/ts/dataStore'

const apiKey = ref<string | undefined>("");
watch(apiKey, (newApiKey) => {
  store.config.get().then(c => {
    c.apiKey = newApiKey || "";
    store.config.set(c);
  })
});

const commonPrompt = ref<string | undefined>("");
watch(commonPrompt, (newPrompt) => {
  store.config.get().then(c => {
    c.commonPrompt = newPrompt || "";
    store.config.set(c);
  })
});

function deleteProfile() {
  window.confirm("Are you sure to delete the profile?") && store.reset();
}

function resetCommonPrompt() {
  commonPrompt.value =
    `常に以下の書式に従って回答してください。
<llm_intro>
{前置きがある場合はその文章}
{段階的な思考を行う場合はその過程}
</llm_intro>
<llm_answer>
{最終的な回答}
</llm_answer>
<llm_outro>
{補足や注意事項がある場合はその文章}
</llm_outro>`;
}

onMounted(() => {
  store.config.get().then(c => {
    apiKey.value = c?.apiKey
    commonPrompt.value = c?.commonPrompt
  })
})
</script>
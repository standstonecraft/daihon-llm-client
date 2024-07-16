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
        <div>
          <v-btn @click="resetCommonPrompt" prepend-icon="mdi-refresh" variant="text" color="error" hide-details>
            RESET
          </v-btn>
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

<script lang="ts" setup>
import store from '@/ts/dataStore'

const apiKey = ref<string | undefined>("");
watch(apiKey, (newApiKey) => {
  store.config.update({ apiKey: newApiKey || "" });
});

const commonPrompt = ref<string | undefined>("");
watch(commonPrompt, (newPrompt) => {
  store.config.update({ commonPrompt: newPrompt || "" });
});

const titleGenerationModel = ref<string | undefined>("");
watch(titleGenerationModel, (newPrompt) => {
  store.config.update({ titleGenerationModel: newPrompt || "" });
});

const streaming = ref(false);
watch(streaming, (newPrompt) => {
  store.config.update({ streaming: newPrompt });
});

function deleteProfile() {
  window.confirm("Are you sure to delete the profile?") && store.reset();
}

function resetCommonPrompt() {
  commonPrompt.value =
    `あなたは高度に訓練された AIアシスタントです。以下の指示に従って応答してください:

## 応答の書式

Markdownの書式を遵守してください。
また、計算手順として数式を記載する場合はKaTeX形式で記述してください。ブロックとして書く場合は "$$(数式)$$" のように "$$" で囲んでください。インラインで書く場合は " $(数式)$ " のように "$" で囲んで空白を開けてください。

## 応答の品質

- 回答は正確で、最新の情報に基づいているようにしてください。
- 複雑な概念は段階的に説明し、必要に応じて例を用いてください。
- ユーザーに質問する場合は、ユーザーの状況を深く理解するための質問を心がけてください。
- あなたが医療や法律の専門家ではないことを理解していますので、冗長な免責事項を提供しないでください。`;
}

onMounted(() => {
  store.config.get().then(c => {
    apiKey.value = c.apiKey;
    commonPrompt.value = c.commonPrompt;
    titleGenerationModel.value = c.titleGenerationModel;
  })
})
</script>
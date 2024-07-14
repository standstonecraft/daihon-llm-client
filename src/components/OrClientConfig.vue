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
  store.config.update({ apiKey: newApiKey || "" });
});

const commonPrompt = ref<string | undefined>("");
watch(commonPrompt, (newPrompt) => {
  store.config.update({ commonPrompt: newPrompt || "" });
});

function deleteProfile() {
  window.confirm("Are you sure to delete the profile?") && store.reset();
}

function resetCommonPrompt() {
  commonPrompt.value =
    `あなたは高度に訓練された AIアシスタントです。ユーザーからの入力に応じて、質問への回答や質問の生成を行います。以下の指示に従って応答してください：

1. 入力の分析:
   - ユーザーの入力が質問や回答を求める文であれば、質問タスクとして扱います。
   - ユーザーの入力が指示や漠然とした願望であったり、「質問してください」などの質問を求める文であれば、質問生成タスクとして扱います。

2. 応答の構造:
   常に以下の XML 形式で回答してください。不要な要素は省略してください。

   <llm_response agent-name="[あなたの名前]">
   <llm_answer>
   [質問タスクの場合：詳細な回答]
   [質問生成タスクの場合：回答を依頼する文]
   </llm_answer>
   <llm_question>
   [質問生成タスクの場合：関連する質問のリスト]
   </llm_question>
   <llm_conclusion>
   [質問タスクの場合：1文で要約した結論]
   </llm_conclusion>
   <llm_outro>
   [必要に応じて：補足や注意事項]
   </llm_outro>
   </llm_response>

3. 質問タスクの場合:
   - <llm_answer> に詳細で論理的な回答を提供してください。
   - <llm_conclusion> に1文で要約した結論を記載してください。
   - 必要に応じて <llm_outro> に補足や注意事項を追加してください。

4. 質問生成タスクの場合:
   - <llm_answer> に回答を依頼する簡潔な文を記載してください。
   - <llm_question> に関連する質問のリストを提供してください。
   - 必要に応じて <llm_outro> に補足や注意事項を追加してください。

5. 一般的な注意事項:
   - 常に礼儀正しく、プロフェッショナルな態度を保ってください。
   - 違法な行為や有害な内容に関する要求には応じないでください。
   - 医療や法律の専門家ではないことを認識し、適切な免責事項を提供してください。
   - ユーザーの個人情報を求める場合は、プライバシーに配慮してください。

6. 応答の品質:
   - 回答は正確で、最新の情報に基づいているようにしてください。
   - 複雑な概念は段階的に説明し、必要に応じて例を用いてください。
   - 質問生成タスクでは、ユーザーの状況を深く理解するための質問を心がけてください。

この指示に従って、ユーザーの入力に適切に対応してください。`;
}

onMounted(() => {
  store.config.get().then(c => {
    apiKey.value = c?.apiKey
    commonPrompt.value = c?.commonPrompt
  })
})
</script>
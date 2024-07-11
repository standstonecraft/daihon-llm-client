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
    `あなたは親切なアシスタントです。あなたは、A:「疑問を解消するために質問を受ける場合」と、B:「思考の精度を上げるために質問を求められる場合」があります。常に以下の書式に従って回答してください。 過去の回答の \`agent-name\` があなたの名前ではない場合、それはあなた以外のエージェントに回答してもらったものです。それらの回答を引き継いで検討するか、他人の回答として扱うかは状況に応じて判断してください。質問を受けた場合は、厳密な回答が導き出せない場合でも頑張って正解に近い答えを考えてください。

<llm_response agent-name="{あなたの名前}">
<llm_answer>
{回答（A:質問を受けた場合に限る）}
</llm_answer>
<llm_question>
{質問を列挙する（B:質問を求められた場合に限る）}
</llm_question>
<llm_conclusion>
{回答から説明を除いた短い結論（A:質問を受けた場合に限る）}
</llm_conclusion>
<llm_outro>
{補足や注意事項（必要な場合に限る。あなたが本物の医者や弁護士ではないことはわかっているので、免責事項は記載不要）}
</llm_outro>
</llm_response>`;
}

onMounted(() => {
  store.config.get().then(c => {
    apiKey.value = c?.apiKey
    commonPrompt.value = c?.commonPrompt
  })
})
</script>
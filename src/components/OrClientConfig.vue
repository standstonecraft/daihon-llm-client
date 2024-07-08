<template>

  <v-sheet border class="d-flex flex-column">
    <div class="pa-4">
      <h2>API</h2>
      <div class="d-flex flex-row pt-2 pl-4">
        <v-text-field v-model="apiKey" label="API Key" hint="Enter OpenRouter API key."></v-text-field>
      </div>
    </div>
    <v-divider></v-divider>
    <div class="pa-4">
      <h2>Profile</h2>
      <div class="d-flex flex-row pt-2 pl-4 ga-4">
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
  </v-sheet>
</template>

<script lang="ts" setup>
import store from '@/ts/dataStore'

const apiKey = ref<string | undefined>("");
watch(apiKey, (newApiKey) => {
  store.config.get().then(c => {
    c.apiKey = newApiKey;
    store.config.set(c);
  })
})

onMounted(() => {
  store.config.get().then(c => {
    apiKey.value = c?.apiKey
  })
})
function deleteProfile() {
  window.confirm("Are you sure to delete the profile?") && store.reset();
}
</script>
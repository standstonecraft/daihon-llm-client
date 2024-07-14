<template>
  <div class="fill-height fill-width">
    <div>
      <v-toolbar density="comfortable">
        <v-img src="@/assets/logo.svg" :width="24" class="ml-2"></v-img>
        <span class="text-h6 font-weight-bold ml-2">Daihon</span>
        <v-tabs v-model="tab" stacked color="primary" class="ml-2 w-100">
          <v-tab value="chat">
            <v-icon>mdi-message-text</v-icon>
            <span class="text-caption">CHAT</span>
          </v-tab>
          <v-tab value="agents">
            <v-icon>mdi-account-tie</v-icon>
            <span class="text-caption">AGENTS</span>
          </v-tab>
          <v-tab value="config">
            <v-icon>mdi-cog</v-icon>
            <span class="text-caption">CONFIG</span>
          </v-tab>
        </v-tabs>

        <v-spacer></v-spacer>

        <v-btn icon stacked @click="openOpenRouter">
          <v-img :width="24" cover src="@/assets/open-router.png"></v-img>
          <span class="text-caption">OPENROUTER</span>
        </v-btn>
        <v-btn icon stacked @click="setTheme(!isDarkTheme)">
          <v-icon>mdi-brightness-6</v-icon>
          <span class="text-caption">THEME</span>
        </v-btn>
      </v-toolbar>
    </div>
    <v-tabs-window v-model="tab" class="fill-height overflow-y-auto" style="max-height: calc(100vh - 86px);">
      <v-tabs-window-item value="chat" class="fill-height">
        <OrClientChat />
      </v-tabs-window-item>
      <v-tabs-window-item value="agents">
        <v-container fluid>
          <OrClientAgentList />
        </v-container>
      </v-tabs-window-item>
      <v-tabs-window-item value="config">
        <v-container fluid>
          <OrClientConfig />
        </v-container>
      </v-tabs-window-item>
    </v-tabs-window>

    <!-- dialog -->
    <v-dialog v-model="dialog" width="auto" @close="dialog = false; errorDialogText = ''">
      <v-card max-width="400" :text="errorDialogText">
        <template v-slot:prepend>
          <v-icon color="error">$warning</v-icon>
        </template>
        <template v-slot:title color="error">
          <span class="text-error" color="error">Error</span>
        </template>
        <template v-slot:actions>
          <v-btn class="ms-auto" text="Ok" @click="dialog = false"></v-btn>
        </template>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { useTheme } from 'vuetify'
import store from "@/ts/dataStore";

/** エラーメッセージ表示 */
export const showErrorDialogKey: InjectionKey<(text: string) => void> = Symbol()
</script>
<script setup lang="ts">

// provide
provide(showErrorDialogKey, showErrorDialog);

// テーマ
const theme = useTheme();
const isDarkTheme = ref(false);

// 変数
const tab = ref("tab");
const dialog = ref(false);
const errorDialogText = ref("");

function openOpenRouter() {
  window.open("https://openrouter.ai/", "_blank");
}

const setTheme = (dark: boolean) => {
  const darkLight = dark ? 'dark' : 'light';
  isDarkTheme.value = dark;
  theme.global.name.value = darkLight;
  store.config.update({ darkTheme: dark });
  document.getElementsByTagName("html")[0].setAttribute("data-theme", darkLight);
}

onBeforeMount(async () => {
  // changeTheme を呼ぶので読込結果を反転する
  await store.config.get().then(c => {
    setTheme(c.darkTheme ?? false);
  });
});
onMounted(() => {
  document.getElementById("loadingDiv")?.remove();
});

function showErrorDialog(text: string) {
  errorDialogText.value = text;
  dialog.value = true;
}
</script>

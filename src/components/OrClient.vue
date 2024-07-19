<template>
  <v-app-bar density="compact" elevation="2" v-if="mobile">
    <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
    <v-app-bar-title>

      <div class="d-flex align-center ga-2">

        <v-img src="@/assets/logo.svg" width="24" max-width="24"></v-img>
        <span>Daihon</span>

      </div>
    </v-app-bar-title>
  </v-app-bar>
  <!-- v-layout ドロワーの座標維持の為必須 -->
  <v-layout class="fill-height fill-width">
    <!-- メニュー -->
    <v-navigation-drawer v-model="drawer" :rail="rail" class="custom-drawer" width="150" mobile-breakpoint="sm"
      :location="mobile ? 'bottom' : undefined">
      <v-list-item class="py-4">
        <template v-slot:prepend>
          <v-img src="@/assets/logo.svg" :width="24"></v-img>
        </template>
        <template v-slot:title>
          <span class="text-h6 font-weight-bold ml-2">Daihon</span>
        </template>
      </v-list-item>
      <v-list nav>
        <v-list-item value="chat" title="Chat" @click="clickTab('chat')" :active="tab === 'chat'"
          prepend-icon="mdi-message-text"></v-list-item>
        <v-list-item value="agents" title="Agents" @click="clickTab('agents')" :active="tab === 'agents'"
          prepend-icon="mdi-account-tie"></v-list-item>
        <v-list-item value="config" title="Config" @click="clickTab('config')" :active="tab === 'config'"
          prepend-icon="mdi-cog"></v-list-item>
      </v-list>
      <template v-slot:append>

        <v-divider></v-divider>
        <v-list density="compact" nav>
          <v-list-item :prepend-icon="rail ? 'mdi-chevron-double-right' : 'mdi-chevron-double-left'" title="Collapse"
            @click="rail = !rail"></v-list-item>
          <v-list-item title="OpenRouter" @click="openOpenRouter">
            <template v-slot:prepend>
              <v-img :width="24" cover src="@/assets/open-router.png"></v-img>
            </template>
          </v-list-item>
          <v-list-item title="Theme" @click="setTheme(!isDarkTheme)">
            <template v-slot:prepend>
              <v-icon>mdi-brightness-6</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>
    <v-main max-height="100vh" style="overflow-y: auto;">
      <OrClientChat v-model="chatDrawer" v-if="tab === 'chat'" />
      <OrClientAgentList v-if="tab === 'agents'" />
      <OrClientConfig v-if="tab === 'config'" />
    </v-main>


    <!-- dialog -->
    <v-dialog v-model="errorDialog" width="auto" @close="errorDialog = false; errorDialogText = ''">
      <v-card max-width="400" :text="errorDialogText">
        <template v-slot:prepend>
          <v-icon color="error">$warning</v-icon>
        </template>
        <template v-slot:title>
          <span class="text-error" color="error">Error</span>
        </template>
        <template v-slot:actions>
          <v-btn class="ms-auto" text="Ok" @click="errorDialog = false"></v-btn>
        </template>
      </v-card>
    </v-dialog>
  </v-layout>
</template>
<style scoped>
.v-navigation-drawer.custom-drawer :deep(.v-list-item__prepend .v-list-item__spacer) {
  width: 0.7rem;
}
</style>
<script setup lang="ts">
import { useTheme, useDisplay } from 'vuetify'
import store from "@/ts/dataStore";
import { injectionKeys } from './injectionSymbols';

// provide
provide(injectionKeys.OrClient.showErrorDialog, showErrorDialog);

const { xs: mobile } = useDisplay();

// 変数
/** 開いているページ */
const tab = ref<"chat" | "agents" | "config">("chat");

/*
 * ドロワー
 */
/** ドロワー開閉 */
const drawer = ref(true);
/** ドロワー展開 */
const rail = ref(false);
/** チャットドロワー展開 */
const chatDrawer = ref(true);
function clickTab(tabName: "chat" | "agents" | "config") {
  if (mobile.value) {
    drawer.value = false;
  }
  if (tabName === "chat") {
    chatDrawer.value = !chatDrawer.value;
  } else {
    chatDrawer.value = false;
  }
  tab.value = tabName;
}
watch(mobile, () => {
  if (!mobile.value) {
    drawer.value = true;
  }
});

/**
 * OpenRouter のウェブサイトを開く
 */
function openOpenRouter() {
  window.open("https://openrouter.ai/", "_blank");
}

/*
 * テーマ
 */
const theme = useTheme();
const isDarkTheme = ref(false);
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
  if (mobile.value) {
    drawer.value = false;
  }
});

/*
 * エラーメッセージ表示
 */
const errorDialog = ref(false);
const errorDialogText = ref("");
function showErrorDialog(text: string) {
  errorDialogText.value = text;
  errorDialog.value = true;
}
</script>

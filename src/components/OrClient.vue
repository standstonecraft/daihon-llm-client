<template>
  <v-layout class="fill-height fill-width">
    <v-app-bar density="compact" elevation="2" v-if="mobile">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>

        <div class="d-flex align-center ga-2">

          <v-img src="@/assets/logo.svg" width="24" max-width="24"></v-img>
          <span>Daihon</span>

        </div>
      </v-app-bar-title>
    </v-app-bar>
    <!-- メニュー -->
    <v-navigation-drawer v-model="drawer" :rail="rail" class="custom-drawer" width="150" mobile-breakpoint="sm"
      :location="mobile ? 'bottom' : undefined">
      <v-list-item class="py-4">
        <template v-slot:prepend>
          <v-img src="@/assets/logo.svg" :width="24" @click="rail = !rail"></v-img>
          <v-tooltip activator="parent" v-if="rail">Daihon</v-tooltip>
        </template>
        <template v-slot:title>
          <span class="text-h6 font-weight-bold ml-2">Daihon</span>
        </template>
      </v-list-item>
      <v-list nav>
        <v-list-item value="chat" title="Chat" @click="clickTab('chat')" :active="tab === 'chat'">
          <template v-slot:prepend>
            <v-icon>mdi-message-text</v-icon>
            <v-tooltip activator="parent" v-if="rail">Chat</v-tooltip>
          </template>
        </v-list-item>
        <v-list-item value="agents" title="Agents" @click="clickTab('agents')" :active="tab === 'agents'">
          <template v-slot:prepend>
            <v-icon>mdi-account-tie</v-icon>
            <v-tooltip activator="parent" v-if="rail">Agents</v-tooltip>
          </template>
        </v-list-item>
        <v-list-item value="config" title="Config" @click="clickTab('config')" :active="tab === 'config'">
          <template v-slot:prepend>
            <v-icon>mdi-cog</v-icon>
            <v-tooltip activator="parent" v-if="rail">Config</v-tooltip>
          </template>
        </v-list-item>
      </v-list>
      <!-- メニュー下部 -->
      <template v-slot:append>
        <v-divider></v-divider>
        <v-list density="compact" nav>
          <v-list-item title="Collapse" @click="rail = !rail">
            <template v-slot:prepend>
              <v-icon>{{ rail ? 'mdi-chevron-double-right' : 'mdi-chevron-double-left' }}</v-icon>
              <v-tooltip activator="parent" v-if="rail">Expand</v-tooltip>
            </template>
          </v-list-item>
          <v-list-item title="OpenRouter" @click="openOpenRouter">
            <template v-slot:prepend>
              <v-img :width="24" cover src="@/assets/open-router.png"></v-img>
              <v-tooltip activator="parent" v-if="rail">OpenRouter</v-tooltip>
            </template>
          </v-list-item>
          <v-list-item title="Theme" @click="setTheme(!isDarkTheme)">
            <template v-slot:prepend>
              <v-icon>mdi-brightness-6</v-icon>
              <v-tooltip activator="parent" v-if="rail">Theme</v-tooltip>
            </template>
          </v-list-item>
          <v-list-item subtitle="ver: 1.0.0">
            <template v-slot:subtitle>
              <span v-show="!rail">ver: 1.0.0</span>
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

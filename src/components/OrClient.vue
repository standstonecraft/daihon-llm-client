<template>
  <v-layout class="fill-height fill-width">
    <!-- ヘッダー モバイル時のみメニューの代わりに表示 -->
    <v-app-bar density="compact" elevation="2" v-if="mobile">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>

        <div class="d-flex align-center ga-2">

          <v-img src="@/assets/logo.svg" width="24" max-width="24"></v-img>
          <span>{{ appShortName }}</span>

        </div>
      </v-app-bar-title>
    </v-app-bar>
    <!-- メニュー -->
    <v-navigation-drawer v-model="drawer" :rail="rail" class="custom-drawer" width="150" mobile-breakpoint="sm"
      :location="mobile ? 'bottom' : undefined">
      <v-list-item class="py-4">
        <template v-slot:prepend>
          <v-img src="@/assets/logo.svg" :width="24" @click="rail = !rail"></v-img>
          <v-tooltip activator="parent" v-if="rail">{{ appShortName }}</v-tooltip>
        </template>
        <template v-slot:title>
          <span class="text-h6 font-weight-bold ml-2">Daihon</span>
        </template>
      </v-list-item>
      <v-list nav>
        <v-list-item v-for="menu in menus" :key="menu.name" :value="menu.name" :title="menu.name"
          @click="clickTab(menu.name)" :active="tab === menu.name">
          <template v-slot:prepend>
            <v-icon>{{ menu.icon }}</v-icon>
            <v-tooltip activator="parent" v-if="rail">{{ menu.name }}</v-tooltip>
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
          <v-list-item title="GitHub" :subtitle="appVersion" @click="openHomepage">
            <template v-slot:prepend>
              <v-icon>mdi-github</v-icon>
              <v-tooltip activator="parent" v-if="rail">GitHub</v-tooltip>
            </template>
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>
    <!-- メインコンテンツ -->
    <OrClientChat v-model="chatDrawer" v-if="tab === 'Chat'" />
    <OrClientAgentList v-if="tab === 'Agents'" />
    <OrClientConfig v-if="tab === 'Config'" />
    <OrClientHelp v-if="tab === 'Help'" />

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

const appShortName = import.meta.env.VITE_SHORT_NAME;
const appVersion = import.meta.env.VITE_VERSION;
const appHomepage = import.meta.env.VITE_HOMEPAGE;

// provide
provide(injectionKeys.OrClient.showErrorDialog, showErrorDialog);

const { xs: mobile } = useDisplay();

type MenuType = "Chat" | "Agents" | "Config" | "Help";

// 変数
/** 開いているページ */
const tab = ref<MenuType>("Chat");
const menus: { name: MenuType; icon: string }[] = [
  { name: "Chat", icon: "mdi-message-text" },
  { name: "Agents", icon: "mdi-account-tie" },
  { name: "Config", icon: "mdi-cog" },
  { name: "Help", icon: "mdi-help-circle" },
]
/*
 * ドロワー
 */
/** ドロワー開閉 */
const drawer = ref(true);
/** ドロワー展開 */
const rail = ref(true);
/** チャットドロワー展開 */
const chatDrawer = ref(true);
function clickTab(tabName: MenuType) {
  if (mobile.value) {
    drawer.value = false;
  }
  if (tabName === "Chat") {
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
/**
 * GitHub リポジトリを開く
 */
function openHomepage() {
  window.open(appHomepage, "_blank");
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

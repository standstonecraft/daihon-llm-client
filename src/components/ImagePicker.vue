<!-- 
- 画像選択コンポーネント
  - 選択した画像を表示する。
  - 画像をクリックすると画像選択ダイアログを表示する。
  - 画像が選択されていない場合はアイコン（mdi-image-off-outline）を表示する。
  - 選択された画像はBASE64形式の文字列としてモデルに保持する。
    
- 画像選択ダイアログ
  - 3つのボタンがある：
    - 「参照」：システムのファイル選択ダイアログを開くボタン
    - 「クリップボード」：クリップボードから画像を取得するボタン
    - 「削除」画像を未選択状態にするボタン
-->
<template>
  <div @click="dialog = true">
    <v-img v-if="image" :width="props.imageSize" cover :src="image"></v-img>
    <v-icon v-else :size="props.imageSize">mdi-image-off-outline</v-icon>
  </div>

  <v-dialog v-model="dialog" width="unset">
    <v-card>
      <v-card-title>Image Select</v-card-title>
      <v-card-text class="d-flex flex-column align-center ga-4">
        <div class="d-flex ga-2">
          <v-btn @click="explore" prepend-icon="mdi-upload" variant="text">
            BROWSE
          </v-btn>
          <v-btn @click="fromClipboard" prepend-icon="mdi-clipboard-outline" variant="text">
            CLIPBOARD
          </v-btn>
          <v-btn @click="image = ''" prepend-icon="$delete" variant="text">
            DELETE
          </v-btn>
        </div>
        <v-img v-if="image" width="240" cover :src="image"></v-img>
        <v-icon v-else size="240">mdi-image-off-outline</v-icon>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="dialog = false" prepend-icon="$complete" variant="text" color="primary">
          DONE
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
/** 画像URL(base64) */
const image = defineModel<string>();
const props = defineProps({
  imageSize: { type: Number, default: 240 },
});

/** 画像選択ダイアログ */
const dialog = ref(false);

async function explore() {
  const [fileHandle] = await window.showOpenFilePicker({
    types: [
      {
        description: "画像ファイル",
        accept: {
          "image/*": [".png", ".jpg", ".jpeg"],
        },
      },
    ],
  });
  const file = await fileHandle.getFile();

  const reader = new FileReader();
  reader.addEventListener(
    "load",
    () => {
      image.value = reader.result as string;
    },
    false,
  );
  reader.readAsDataURL(file);
}

async function fromClipboard() {
  const items = await navigator.clipboard.read();
  const item = items.find((i) => i.types.includes("image/png"));
  if (item) {
    const blob = await item.getType("image/png");
    const reader = new FileReader();
    reader.addEventListener(
      "load",
      () => {
        image.value = reader.result as string;
      },
      false,
    );
    reader.readAsDataURL(blob);
  }
}
</script>
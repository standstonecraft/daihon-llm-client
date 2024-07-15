<template>
  <v-sheet border min-width="500">
    <!-- <v-sheet color="surface-variant" max-width="600" rounded> -->
    <v-container fluid class="h-100">
      <v-row class="h-100">
        <!-- 画像列 -->
        <v-col cols="12" sm="2" class="h-100">
          <v-dialog v-model="imageDialog">
            <template v-slot:activator="{ props: activatorProps }">
              <div v-bind="activatorProps">
                <div v-if="inputs.image">
                  <v-img :width="60" cover :src="inputs.image"></v-img>
                </div>
                <div v-else class="align-self-center">
                  <v-icon size="60">mdi-image-off-outline</v-icon>
                </div>
              </div>
            </template>

            <template v-slot:default="{ isActive }">
              <v-card title="画像URL">
                <v-card-text>
                  <v-text-field label="Image URL" clearable density="comfortable" v-model="tempImage"></v-text-field>
                </v-card-text>

                <v-card-actions>
                  <v-btn text="更新" @click="isActive.value = false"></v-btn>
                </v-card-actions>
              </v-card>
            </template>
          </v-dialog>
        </v-col>
        <!-- 入力列 -->
        <v-col cols="12" sm="10" class="pa-3">
          <v-row class="no-gutters">
            <v-col cols="12" class="pb-0">
              <v-text-field label="Name" v-model="inputs.name" clearable density="compact"></v-text-field>
            </v-col>
          </v-row>
          <v-row class="no-gutters">
            <v-col cols="12" class="py-0">
              <v-text-field label="Model" v-model="inputs.model" clearable density="compact"></v-text-field>
            </v-col>
          </v-row>
          <v-row class="no-gutters">
            <v-col cols="12" class="py-0">
              <v-textarea label="System Prompt" v-model="inputs.systemPrompt" density="compact" row-height="20" rows="3"
                auto-grow class="">
              </v-textarea>
            </v-col>
          </v-row>
          <v-row justify="end" class="no-gutters">
            <v-col cols="12" class="pt-0">
              <div class="d-flex justify-end ga-2">
                <v-btn @click="store.agents.remove(inputs.id)" prepend-icon="$delete" variant="text" color="error">
                  DELETE
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
</template>
<script setup lang="ts">
import { ref } from "vue";
import store from "@/ts/dataStore";
import { type Agent } from "@/ts/dataStore/agents";

const props = defineProps<Agent>();

/*
 * 入力要素
 * 更新されたらデータベースに反映→propsに反映される
 */
const inputs = reactive<Agent>({ ...props });
watch(inputs, ((n, _o) => store.agents.update(n.id, n)));

/*
 * 画像URL入力ダイアログ
 */
const imageDialog = ref(null);
const tempImage = ref("");
watch(imageDialog, (newDialogOpen, oldDialogOpen) => {
  if (newDialogOpen) {
    tempImage.value = ""
  } else if (oldDialogOpen != null && !newDialogOpen) {
    // OK押下時 画像URLを更新
    // 初期起動時に変にならないようにoldDialogOpenがnullでないチェックを行う
    inputs.image = tempImage.value;
  }
});
</script>
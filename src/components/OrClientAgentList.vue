<template>
  <div class="pa-2" style="overflow-y: auto;">
    <div class="d-flex flex-wrap flex-grow-0 ga-4">
      <OrClientAgentCard v-for="agent in agents" :key="agent.id" v-bind="agent" />
    </div>
    <v-btn color="primary" class="w-100 mt-4" @click="addAgent">
      <v-icon>$plus</v-icon>
      <span>Add Agent</span>
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import store from '@/ts/dataStore';
import { Agent } from '@/ts/dataStore/agents';
import useLiveQuery from "@/ts/withDexie";

const agents = useLiveQuery<Agent[]>(async () => (await store.agents.getAll().toArray()).filter(x => !x.isDeleted) || [], []);

/**
 * 新しいエージェントを追加
 */
function addAgent() {
  store.agents.add({
    // id: (auto increment),
    model: "google/gemma-2-9b-it:free",
    name: "Agent " + new Date().toUTCString(),
    image: "",
    systemPrompt: "",
    isDeleted: false,
  });
}
</script>
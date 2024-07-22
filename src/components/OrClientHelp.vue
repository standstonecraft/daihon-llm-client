<template>
  <v-sheet class="pa-4" fill-height>
    <h1>Help</h1>
    <h2>Get Started</h2>
    <p>API key Setting</p>
    <ol>
      <li>Create an <a href="https://openrouter.ai/" target="_blank">OpenRouter</a> account and an API key.</li>
      <li>In the Config <v-icon>mdi-cog</v-icon> page, enter your API key.</li>
    </ol>
    <p>Agent Setting</p>
    <ol>
      <li>Choose the LLM model(s) on <a href="https://openrouter.ai/models" target="_blank">Models</a> page.To copy the
        model name, click the clipboard button next to the model name.</li>
      <li>In the Agent <v-icon>mdi-account-tie</v-icon> page, click the "ADD AGENT" button and enter the required
        information. </li>
    </ol>
    <p>Start Chat</p>
    <ol>
      <li>In the Chat <v-icon>mdi-message-text</v-icon> page, click the "NEW CHAT" button.</li>
      <li>Select the agent(s) you want to use.</li>
      <li>Click the "+" button.</li>
      <li>Write your question in Content text box.</li>
      <li>If you want to send an image, click "Text" switch then click image icon
        <v-icon>mdi-image-off-outline</v-icon>. You can upload or paste an image.
      </li>
      <li>Click the Save <v-icon>$complete</v-icon> button.</li>
      <li>Click the Send <v-icon>mdi-send</v-icon> button.</li>
    </ol>
  </v-sheet>
</template>
<style>
p {
  padding-left: 1rem;
  margin-top: 1rem;
}

ol {
  padding-left: 2rem;
}
</style>
import OpenAI from "openai";
import store from "./dataStore";
import { ChatCompletion, ChatCompletionAssistantMessageParam, ChatCompletionCreateParamsNonStreaming, ChatCompletionMessageParam, ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from "openai/resources/chat/completions.mjs";
import { ChatContent } from "./dataStore/chatContents";
import { ChatCompletionStreamParams } from "openai/resources/beta/chat/completions.mjs";
import { Stream } from "openai/streaming.mjs";

/**
 * Sends a request to OpenRouter API to generate a response for a given chat and agent.
 * @param chatId The ID of the chat.
 * @param agentId The ID of the agent.
 * @throws Error if the configuration is not found.
 */
export async function requestOpenRouter(chatId: number, agentId: number) {
  // Get the configuration from the store
  const config = await store.config.get();
  if (!config) {
    throw new Error("Config not found");
  }

  // Create a new instance of OpenAI with the provided configuration
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: config.apiKey,
    defaultHeaders: {
      "X-Title": "Daihon LLM Client", // App name
    },
    dangerouslyAllowBrowser: true,
  });

  // Add a new message to the store with the current timestamp
  const messageId = await store.messages.add({ chatId, createdAt: new Date().toISOString() });

  // Create the base content object with the chat ID, message ID, and agent ID
  const contentBase = createContentBase(chatId, messageId, agentId);

  // Check if streaming is enabled in the configuration
  const streaming = config.streaming;

  // Create the completion parameter based on the streaming flag
  const completionParam = await createParameter(chatId, agentId, streaming);
  console.trace(completionParam);

  try {
    // Send the completion request to OpenRouter API
    const completion = await openai.chat.completions.create(completionParam, streaming ? { stream: true } : undefined);
    console.trace(completion);

    if (streaming) {
      // Handle streaming completion
      let contentId = -1;
      let contentText = "";
      for await (const chunk of completion as Stream<OpenAI.Chat.Completions.ChatCompletionChunk>) {
        const delta = chunk.choices[0].delta?.content;
        if (delta) {
          contentText += delta;
          if (contentId < 0) {
            // Add the first delta to the store
            contentId = await store.contents.add({
              ...contentBase,
              content: contentText,
              createdAt: new Date().toISOString(),
              enabled: true
            });
          } else {
            // Update the existing content with the new delta
            await store.contents.update({
              id: contentId,
              ...contentBase,
              content: contentText,
              createdAt: new Date().toISOString(),
              enabled: true
            });
          }
        }
      }
    } else {
      // Handle non-streaming completion
      const nonStreamingCompletion = completion as ChatCompletion;
      for (const ch of nonStreamingCompletion.choices) {
        // Add each choice to the store
        await store.contents.add({
          ...contentBase,
          content: ch.message.content || "",
          createdAt: new Date().toISOString(),
          enabled: true
        });
      }

      // Update the chat with the latest timestamp and token usage
      const chat = await store.chats.get(chatId);
      if (chat) {
        chat.updatedAt = new Date().toISOString();
        await store.chats.update({
          ...chat,
          updatedAt: new Date().toISOString(),
          lastTokenCount: {
            input: nonStreamingCompletion.usage?.prompt_tokens,
            output: nonStreamingCompletion.usage?.completion_tokens,
            total: nonStreamingCompletion.usage?.total_tokens
          }
        });
      }
    }

  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      // Add the error message to the store
      await store.contents.add({
        ...contentBase,
        content: error.message || "",
        createdAt: new Date().toISOString(),
        enabled: false
      });
    } else {
      throw error;
    }
  }
}

function createContentBase(chatId: number, messageId: number, agentId: number): Omit<ChatContent, "id" | "createdAt" | "content" | "enabled"> {
  return {
    chatId: chatId,
    messageId: messageId,
    agentId: agentId,
    role: "assistant",
    contentType: "text",
    contentImage: "",
    invalid: []
  };
}

function contentToMessageParam(c: ChatContent, agentName: string): ChatCompletionMessageParam {
  switch (c.role) {
    case 'system':
      const retSystem: ChatCompletionSystemMessageParam = {
        role: c.role, content: c.content,
        // name: agentName 
      };
      return retSystem;
    case 'assistant':
      const retAssistant: ChatCompletionAssistantMessageParam = {
        role: c.role, content: c.content,
        //  name: agentName
      };
      return retAssistant;
    case 'user':
      if (c.contentType === 'image_url') {
        const retUserImage: ChatCompletionUserMessageParam = {
          role: c.role,
          content: [
            { type: "image_url", image_url: { url: c.contentImage } },
            { type: "text", text: c.content }
          ],
          // name: "USER"
        };
        return retUserImage;
      } else {
        const retUserText = {
          role: c.role, content: c.content,
          // name: "USER"
        };
        return retUserText;
      }
  }
}


/**
 * Creates the parameter object for chat completion.
 * @param chatId The ID of the chat.
 * @param agentId The ID of the agent.
 * @param streaming Whether to use streaming or not.
 * @returns The chat completion parameter object.
 * @throws {Error} If the agent or model is not found. If one or more content is invalid.
 */
async function createParameter(chatId: number, agentId: number, streaming: boolean) {
  // Get the agent with the given ID
  const agent = await store.agents.get(agentId);
  // If the agent is not found, throw an error
  if (!agent) {
    throw new Error(`Agent '${agentId}': Not found. Please check the agent settings.`);
  }
  // Get the model from the agent
  const model = agent.model;
  // If the model is not found, throw an error
  if (!model) {
    throw new Error(`Agent '${agent.name}': The model is missing. Please check the agent settings.`);
  }
  // Create the system message parameter
  const systemMessage: ChatCompletionUserMessageParam[] =
    agent.systemPrompt
      ? [{ role: "user", content: agent.systemPrompt }]
      : [];
  // Get all enabled contents with the given chat ID
  const contents = await store.contents.getAll()
    .where("chatId").equals(chatId).and(c => c.enabled).toArray();
  // If any content is invalid, throw an error
  if (contents.some(c => c.invalid.length > 0)) {
    throw new Error("One or more content is invalid. Please check the messages.");
  }
  // Create the message parameters from the contents
  const messages: ChatCompletionMessageParam[] = contents.map(c => contentToMessageParam(c, agent.name));
  // If streaming is enabled, return a streaming parameter object
  if (streaming) {
    return {
      model: model,
      messages: [...systemMessage, ...messages],
      stream: true
    } as const satisfies ChatCompletionStreamParams;
  }
  // Return a non-streaming parameter object
  return {
    messages: [...systemMessage, ...messages],
    model: model,
  } as const satisfies ChatCompletionCreateParamsNonStreaming;
}


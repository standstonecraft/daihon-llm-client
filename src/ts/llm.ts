import OpenAI from "openai";
import store from "./dataStore";
import { ChatCompletion, ChatCompletionAssistantMessageParam, ChatCompletionCreateParamsNonStreaming, ChatCompletionMessageParam, ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from "openai/resources/chat/completions.mjs";
import { ChatContent } from "./dataStore/chatContents";
import { ChatCompletionStreamParams } from "openai/resources/beta/chat/completions.mjs";
import { Stream } from "openai/streaming.mjs";
import { deepParseJson } from "deep-parse-json"

/**
 * For errors, OpenRouter returns a JSON response with the following shape:
 */
type ErrorResponse = {
  error: {
    code: number;
    message: string;
    metadata?: Record<string, unknown>;
  };
};
/**
 * Sends a request to OpenRouter API to generate a response for a given chat and agent.
 */
export async function requestOpenRouter(chatId: number, messageId: number, agentId: number) {

  // Create the base content object with the chat ID, message ID, and agent ID
  const contentBase = createContentBase(chatId, messageId, agentId);

  try {
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

    // Check if streaming is enabled in the configuration
    const streaming = config.streaming;

    // Create the completion parameter based on the streaming flag
    const completionParam = await createParameter(chatId, agentId, config.commonPrompt, streaming);
    console.trace(completionParam);

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
      if (Object.hasOwn(completion, "error")) {
        // @ts-ignore
        const err = completion as ErrorResponse;
        const json = deepParseJson(err.error.message);
        // throw new Error("```\n" + JSON.stringify(json, null, 2) + "\n```");
        throw new Error(objectToMarkdown(json));
      }
      const nonStreamingCompletion = completion as ChatCompletion;
      for (const ch of (completion as ChatCompletion).choices) {
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
        await store.chats.update(chatId, {
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

function objectToMarkdown(obj: object, level = 1) {
  let markdown = '';

  for (const [key, value] of Object.entries(obj)) {
    const heading = '#'.repeat(level);
    markdown += `${heading} ${key}\n\n`;

    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => {
          markdown += `- ${item}\n`;
        });
      } else {
        markdown += objectToMarkdown(value, level + 1);
      }
    } else {
      markdown += `${value}\n\n`;
    }
  }

  return markdown;
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

function contentToMessageParam(c: ChatContent): ChatCompletionMessageParam {
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
 * @param commonPrompt The common prompt.
 * @param streaming Whether to use streaming or not.
 * @returns The chat completion parameter object.
 * @throws {Error} If the agent or model is not found. If one or more content is invalid.
 */
async function createParameter(chatId: number, agentId: number, commonPrompt: string | null, streaming: boolean) {
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
  const systemMessage: ChatCompletionSystemMessageParam = {
    role: "system",
    content: `あなたの名前は"${agent.name}"です。`
  };
  if (commonPrompt) {
    systemMessage.content += "\n\n" + commonPrompt;
  }
  if (agent.systemPrompt) {
    systemMessage.content += "\n\n" + agent.systemPrompt;
  }
  // Get all enabled contents with the given chat ID
  const contents = await store.contents.getAll()
    .where("chatId").equals(chatId).and(c => c.enabled).toArray();
  // If any content is invalid, throw an error
  if (contents.some(c => c.invalid.length > 0)) {
    throw new Error("One or more content is invalid. Please check the messages.");
  }
  // Create the message parameters from the contents
  const messages: ChatCompletionMessageParam[] = contents.map(c => contentToMessageParam(c));
  // If streaming is enabled, return a streaming parameter object
  if (streaming) {
    return {
      model: model,
      messages: [systemMessage, ...messages],
      stream: true
    } as const satisfies ChatCompletionStreamParams;
  }
  // Return a non-streaming parameter object
  return {
    messages: [systemMessage, ...messages],
    model: model,
  } as const satisfies ChatCompletionCreateParamsNonStreaming;
}

const titleSuggestionPrompt = `この会話の短いタイトルを考えてください。
いくつか候補をあげたあと、最も優れた1つを選び、下記の書式で回答してください：

<llm_title>{タイトル}</llm_title>`;
/**
 * LLMにチャットのタイトルを考えてもらう
 * @param chatId The ID of the chat.
 * @returns The title of the chat.
 */
export async function askChatTitle(chatId: number) {
  try {
    // Get the configuration from the store
    const config = await store.config.get();
    // get all enabled contents with the given chat ID
    const contents = await store.contents.getAll()
      .where("chatId").equals(chatId).and(c => c.enabled).filter(c => c.role != 'system').toArray();
    // if contents is empty
    if (contents.length === 0) throw new Error('No content');
    // convert to message param
    const messages = contents.map(contentToMessageParam);
    // add title suggestion prompt
    messages.push({ role: "user", content: titleSuggestionPrompt });

    // Create a new instance of OpenAI with the provided configuration
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: config.apiKey,
      defaultHeaders: {
        "X-Title": "Daihon LLM Client", // App name
      },
      dangerouslyAllowBrowser: true,
    });
    const completionParam = {
      messages,
      model: config.titleGenerationModel,
    } as const satisfies ChatCompletionCreateParamsNonStreaming;
    // request
    const completion = await openai.chat.completions.create(completionParam);
    // retrieve response
    const resonse = completion.choices[0].message.content ?? '';
    // response is null
    if (!resonse) throw new Error('No response');
    // extract answer. answer is surrounded by <llm_title> and </llm_title>
    const answer = resonse.match(/<llm_title>(.*?)<\/llm_title>/)?.[1] ?? '';
    // format error 
    if (!answer) throw new Error('Invalid response format. The model provided in config may not be suitable for this task.');
    return answer;
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      throw new Error(`Chat title suggestion failed: ${error.message}`);
    } else {
      throw new Error('Unknown error');
    }
  }
}
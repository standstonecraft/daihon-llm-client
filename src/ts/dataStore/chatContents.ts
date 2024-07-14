
// import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { type DbType } from "../dataStore";
/**
 * 会話コンテンツ
 */
export type ChatContent = {
  id: number;
  chatId: number;
  messageId: number;
  agentId: number;
  role: "assistant" | "user" | "system";
  contentType: "text" | "image_url";
  content: string;
  contentImage: string;
  enabled: boolean;
  createdAt: string;
  invalid: { name: string, message: string }[];
}

async function validate(content: Omit<ChatContent, "id">, db: DbType) {
  const invalid: { name: string, message: string }[] = [];
  if (content.agentId > -1 && await db.agents.where("id").equals(content.agentId).count() === 0) {
    invalid.push({ name: "agentId", message: "Agent not found. Please add the agent and select it." });
  }
  if (!content.content) {
    invalid.push({ name: "content", message: "Content is required." });
  }
  if (content.contentType === "image_url" && !content.contentImage) {
    invalid.push({ name: "contentImage", message: "ContentImage is required." });
  }
  return invalid;
}

const contentsStore = (db: DbType) => ({
  /**
   * データベースにコンテンツを追加します。
   */
  add: async (content: Omit<ChatContent, "id">) =>
    await db.contents.add({ ...content, invalid: await validate(content, db) }),

  /**
   * データベースからコンテンツを取得します。
   */
  get: (id: number) => db.contents.get(id),

  /**
   * データベースからコンテンツを削除します。
   */
  remove: (id: number) => db.contents.delete(id),

  /**
   * データベースから全てのコンテンツを取得します。
   */
  getAll: () => db.contents,

  /**
   * データベースからコンテンツを更新します。
   */
  update: async (content: ChatContent) => await db.contents.update(content.id, { ...content, invalid: await validate(content, db) }),
});
export default contentsStore;
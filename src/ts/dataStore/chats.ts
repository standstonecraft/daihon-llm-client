import { InsertType, UpdateSpec } from "dexie";
import { type DbType } from "../dataStore";
/**
 * 会話
 */
export type Chat = {
  /** 会話ID */
  id: number;
  /** 会話のタイトル */
  title?: string;
  /** エージェント名リスト */
  agentNames: string;
  /** 会話の開始日時 */
  createdAt: string;
  /** 会話の更新日時 */
  updatedAt: string;
  /** 最後のリクエストのトークン数 */
  lastTokenCount?: {
    input?: number;
    output?: number;
    total?: number;
  }
}

const chatsStore = (db: DbType) => ({
  /**
   * データベースに会話を追加します。
   */
  add: (chat: Omit<Chat, "id">) => db.chats.add(chat),

  /**
   * データベースから会話を取得します。
   */
  get: (id: number) => db.chats.get(id),
  /**
   * データベースから会話を削除します。
   */
  remove: async (id: number) => {
    await db.chats.delete(id);
    await db.messages.where("chatId").equals(id).delete();
    await db.contents.where("chatId").equals(id).delete();
  },

  /**
   * データベースから会話を更新します。
   */
  update: (chatId: number, updSpec: UpdateSpec<InsertType<Chat, "id">>) =>
    db.chats.update(chatId, { ...updSpec, updatedAt: new Date().toISOString() }),

  /**
   * データベースからすべての会話を取得します。
   */
  getAll: () => db.chats,

})
export default chatsStore;
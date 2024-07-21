
import { type DbType } from "../dataStore";
/**
 * 会話メッセージ
 */
export type ChatMessage = {
  /** メッセージID */
  id: number;
  /** チャットID */
  chatId: number;
  /** 作成日時 */
  createdAt: string;
}

const messagesStore = (db: DbType) => ({
  /**
   * データベースにメッセージを追加します。
   */
  add: (message: Omit<ChatMessage, "id">) => db.messages.add(message),

  /**
   * データベースからメッセージを削除します。
   */
  remove: async (id: number) => {
    await db.messages.delete(id);
    await db.contents.where("messageId").equals(id).delete();
  },

  /**
   * データベースから全てのメッセージを取得します。
   */
  getAll: () => db.messages,
});
export default messagesStore;
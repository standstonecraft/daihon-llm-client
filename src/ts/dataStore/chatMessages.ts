
import { type DbType } from "../dataStore";
/**
 * 会話メッセージ
 */
export type ChatMessage = {
  id: number;
  chatId: number;
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

  /**
   * データベースからメッセージを更新します。
   */
  update: (message: ChatMessage) => db.messages.update(message.id, message),
});
export default messagesStore;
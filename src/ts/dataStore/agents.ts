import { InsertType, UpdateSpec } from "dexie";
import { type DbType } from "../dataStore";
/**
 * エージェント
 */
export type Agent = {
  /** エージェントID */
  id: number;
  /** エージェントのモデル */
  model: string;
  /** エージェントの名前 */
  name: string;
  /** エージェントの画像 */
  image?: string;
  /** エージェントのシステムプロンプト */
  systemPrompt?: string;
  /** 削除済みフラグ */
  isDeleted: boolean;
  /** ピン留めフラグ */
  isPinned: boolean;
}

const agentsStore = (db: DbType) => ({
  /**
   * データベースにエージェントを追加します。
   */
  add: (agent: Omit<Agent, "id">) => db.agents.add(agent),

  /**
   * データベースからエージェントを取得します。
   */
  get: (id: number) => db.agents.get(id),

  /**
   * データベースからエージェントを更新します。
   */
  update: (agentId: number, updSpec: UpdateSpec<InsertType<Agent, "id">>) => db.agents.update(agentId, updSpec),

  /**
   * データベースからエージェントを論理削除します。
   */
  remove: (id: number) => db.agents.update(id, { isDeleted: true, isPinned: false }),

  /**
   * エージェントをすべて取得する
   */
  getAll: () => db.agents,

  /**
   * エージェントをピン留めする
   * すでにピン留めされている場合はピン留めを解除する
   * ピン留めする場合、他のエージェントのピン留めを解除する
   */
  async pin(id: number) {
    db.transaction('rw', db.agents, async () => {
      const agent = await db.agents.where("id").equals(id).first();
      if (!agent) return;
      if (agent.isPinned) {
        // unpin
        await db.agents.update(id, { isPinned: false });
      } else {
        // unpin all
        await db.agents.where("id").notEqual(id).modify({ isPinned: false });
        // pin
        await db.agents.update(id, { isPinned: true });
      }
    });
  }
});
export default agentsStore;
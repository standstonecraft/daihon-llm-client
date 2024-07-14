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
   * データベースからエージェントを削除します。
   */
  remove: (id: number) => db.agents.delete(id),

  /**
   * エージェントをすべて取得する
   */
  getAll: () => db.agents,
});
export default agentsStore;
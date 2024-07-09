import { type DbType } from "../dataStore";

/**
 * 設定情報
 */
export type Config = {
  id?: number;
  apiKey?: string;
  darkTheme?: boolean;
  streaming: boolean;
}
const CONFIG_ID = 0;

const configStore = (db: DbType) => ({
  /**
   * 設定を取得します。
   * @returns APIキー
   */
  get: async () => await db.config.get(CONFIG_ID) ?? {
    id: 0,
    apiKey: "",
    darkTheme: true,
    streaming: false,
  },

  /**
   * 設定をデータベースに保存します。
   *
   */
  set: (config: Config) => db.config.put(config),
})
export default configStore;
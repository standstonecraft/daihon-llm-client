import { type DbType } from "../dataStore";

/**
 * 設定情報
 */
export type Config = {
  id: number;
  apiKey: string;
  commonPrompt: string;
  darkTheme?: boolean;
  streaming: boolean;
}
const CONFIG_ID = 0;


async function get(db: DbType) {
  return await db.config.get(CONFIG_ID) ?? {
    id: 0,
    apiKey: "",
    commonPrompt: "",
    darkTheme: true,
    streaming: false,
  };
}

const configStore = (db: DbType) => ({
  /**
   * 設定を取得します。
   * @returns APIキー
   */
  get: async () => await get(db),

  /**
   * 設定をデータベースに保存します。
   *
   */
  update: (cfg: Partial<Config>) => get(db).then(c => db.config.put({ ...c, ...cfg })),
})
export default configStore;

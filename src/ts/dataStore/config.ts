import { type DbType } from "../dataStore";

/**
 * 設定情報
 */
export type Config = {
  /** 設定ID 0固定 */
  id: number;
  /** APIキー */
  apiKey: string;
  /** 共通プロンプト */
  commonPrompt: string;
  /** ダークテーマ */
  darkTheme?: boolean;
  /** ストリーミング */
  streaming: boolean;
  /** タイトル生成モデル */
  titleGenerationModel: string;
}
const CONFIG_ID = 0;

/** デフォルトの設定 */
const defaultConfig: Config = {
  id: 0,
  apiKey: "",
  commonPrompt: "あなたは高度に訓練された AIアシスタントです。",
  darkTheme: true,
  streaming: false,
  titleGenerationModel: "anthropic/claude-3-haiku",
};
async function get(db: DbType) {
  return { ...defaultConfig, ...(await db.config.get(CONFIG_ID)) };
}

const configStore = (db: DbType) => ({
  /**
   * 設定を取得します。取得できない内容はデフォルト値を返します。
   * @returns APIキー
   */
  get: async () => await get(db),

  /**
   * 設定をデータベースに保存します。
   *
   */
  update: (cfg: Partial<Config>) => get(db).then(got => db.config.put({ ...got, ...cfg })),
})
export default configStore;

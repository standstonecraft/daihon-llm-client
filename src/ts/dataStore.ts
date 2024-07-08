import Dexie, { type EntityTable } from 'dexie';
import configStore, { Config } from "./dataStore/config";
import agentsStore, { Agent } from "./dataStore/agents";
import chatsStore, { Chat } from "./dataStore/chats";
import messagesStore, { ChatMessage } from "./dataStore/chatMessages";
import contentsStore, { ChatContent } from "./dataStore/chatContents";


/** 設定は単一のエンティティであるため、IDは0固定 */
const CONFIG_ID = 0;
export type DbType = Dexie & {
  config: EntityTable<Config, 'id'>;
  agents: EntityTable<Agent, 'id'>;
  chats: EntityTable<Chat, 'id'>;
  messages: EntityTable<ChatMessage, 'id'>;
  contents: EntityTable<ChatContent, 'id'>;
};

// データベース
// primary key "id" (for the typings only)
const db = new Dexie('myDatabase') as DbType;
db.version(1).stores({
  config: 'id', // Primary key and indexed props
  agents: '++id, &name',
  chats: '++id',
  messages: '++id, chatId',
  contents: '++id, chatId, messageId',
});

const store = {
  config: configStore(db),
  agents: agentsStore(db),
  chats: chatsStore(db),
  contents: contentsStore(db),
  messages: messagesStore(db),
  /**
   * DBをリセット
   */
  reset: () => Promise.all(db.tables.map((table) => table.clear())),
  /**
   * データベースから設定とエージェントデータをダウンロードし、JSONファイルとして保存します。
   * 
   * @return {Promise<void>} ダウンロードが完了したときに解決するPromise
   */
  download: async (): Promise<void> => {
    const config = await db.config.get(CONFIG_ID);
    const agents = await db.agents.toArray();
    const data = { config, agents };

    const text = JSON.stringify(data, null, 2);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.setAttribute("href", url);
    anchor.setAttribute("download", "e4tool.json");

    const mouseEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
    });

    anchor.dispatchEvent(mouseEvent);
  },

  /**
   * ファイルをアップロードし、その内容を読み取り、JSONデータをパースし、データベースに格納します。
   * 
   * @return {Promise<void>} データが正常に格納されたときに解決するプロミスです。エラーが発生した場合、プロミスは拒否されます。rejectのreasonはErrorオブジェクトです。
   */
  upload: (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      function rej(message: string) {
        console.error(message);
        reject(new Error(message));
      }

      // ファイル選択用の入力要素
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".json";
      fileInput.multiple = false;
      // ファイル選択時の処理
      fileInput.onchange = (event) => {
        const t = event.target as HTMLInputElement;
        // ファイルが選択されていない場合は終了
        if (!t.files) return;
        const file = t.files[0];
        const reader = new FileReader();
        // 読み込み終了時の処理
        reader.onload = async (event) => {
          const json = event.target?.result;
          if (!json) {
            rej("json is missing.");
            return;
          }
          const load = JSON.parse(json as string);
          if (!load) {
            rej("load is missing.");
          } else if (!load.config) {
            rej("config is missing.");
          } else if (!load.agents) {
            rej("agents is missing.");
          } else {
            try {
              await store.reset();
              await db.config.put(load.config);
              await db.agents.bulkPut(load.agents);
            } catch (error) {
              console.error(error);
              rej("Failed to store data into database.");
            }
            resolve();
          }
        };
        // ファイルを読み込む
        reader.readAsText(file);
      };
      // ファイル選択
      fileInput.click();
    })
  },
};
export default store;
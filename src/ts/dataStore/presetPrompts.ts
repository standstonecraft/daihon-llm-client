import { InsertType, UpdateSpec } from "dexie";
import { type DbType } from "../dataStore";

export type PresetPrompt = {
    id: number;
    name: string;
    prompt: string;
    isOn: boolean;
    sortIndex: number;
};

/** デフォルトの設定 */
const defaults: Omit<PresetPrompt, "id">[] = [
    {
        name: "Rephrase and Respond",
        prompt: "質問を言い換えて、拡張し、そして答えてください。",
        isOn: false,
        sortIndex: 0
    },
    {
        name: "Chain of Thoughts",
        prompt: "段階的に考えてください。",
        isOn: false,
        sortIndex: 1
    },
    {
        name: "Emotion Prompt",
        prompt: "回答する前に深呼吸をして、自分を信じ限界を超えてください。",
        isOn: false,
        sortIndex: 2
    },
    {
        name: "Translate to English",
        prompt: "------------\n上記を英語に翻訳してください。",
        isOn: false,
        sortIndex: 3
    },
    {
        name: "Markdown",
        prompt: "Markdown形式で章立てて回答してください。",
        isOn: false,
        sortIndex: 4
    },
    {
        name: "KaTeX",
        prompt: '計算手順として数式を記載する場合はKaTeX形式で記述してください。ブロックとして書く場合は "$$(改行)(数式)(改行)$$" のように "$$" で囲んでください。インラインで書く場合は " $(数式)$ " のように "$" で囲んで空白を開けてください。',
        isOn: false,
        sortIndex: 5
    },
    {
        name: "Self Refine",
        prompt: "今のあなたの回答をフィードバックし、その結果を考慮して回答を修正してください。",
        isOn: false,
        sortIndex: 6
    },
    {
        name: "Program of Thoughts",
        prompt: "答えを導き出すためのPythonのコードを出力してください。",
        isOn: false,
        sortIndex: 7
    },
];

async function addDefaults(db: DbType) {
    const maxSortIndex = (await db.presetPrompts.toArray() || []).map(p => p.sortIndex).reduce((a, b) => Math.max(a, b), -1);
    for (const d of defaults.map(d => ({ ...d, sortIndex: maxSortIndex + 1 + d.sortIndex }))) {
        await db.presetPrompts.add(d);
    }
}

const presetPromptsStore = (db: DbType) => ({
    /**
     * 設定を取得します。取得できない内容はデフォルト値を返します。
     * @returns APIキー
     */
    getAll: async () => {
        const cnt = await db.presetPrompts.count();
        if (cnt === 0) {
            setTimeout(() => {
                addDefaults(db);
            }, 100);
        }
        return db.presetPrompts;
    },

    get: async (id: number) => db.presetPrompts.get(id),

    addDefaults: async () => addDefaults(db),

    add: async () => {
        const maxSortIndex = (await db.presetPrompts.toArray() || []).map(p => p.sortIndex).reduce((a, b) => Math.max(a, b), -1);
        return db.presetPrompts.add({
            name: "New Prompt",
            prompt: "New Prompt",
            isOn: false,
            sortIndex: maxSortIndex + 1
        });
    },
    /**
     * 設定をデータベースに保存します。
     *
     */
    update: (id: number, pre: UpdateSpec<InsertType<PresetPrompt, "id">>) => db.presetPrompts.update(id, pre),

    remove: (id: number) => db.presetPrompts.delete(id),
})
export default presetPromptsStore;


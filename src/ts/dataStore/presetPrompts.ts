import { InsertType, UpdateSpec } from "dexie";
import { type DbType } from "../dataStore";

export type PresetPrompt = {
    id: number;
    name: string;
    prompt: string;
    isOn: boolean;
    sortIndex: number;
};

let sidx = 0;
/** デフォルトの設定 */
const defaults: Omit<PresetPrompt, "id">[] = [
    {
        name: "Answer Formatting",
        prompt: "\n## 回答時の注意事項：\n",
        isOn: false,
        sortIndex: sidx++
    },
    {
        name: "For Beginners",
        prompt: "- 専門分野に全く詳しくない人でもわかるように説明すること。",
        isOn: false,
        sortIndex: sidx++
    },
    {
        name: "Rephrase and Respond",
        prompt: "- 回答の前に質問を言い換えて、拡張すること。",
        isOn: false,
        sortIndex: sidx++
    },
    {
        name: "Chain of Thoughts",
        prompt: "- 段階的に考えること。",
        isOn: false,
        sortIndex: sidx++
    },
    {
        name: "Emotion Prompt",
        prompt: "- 回答する前に深呼吸をして、自分を信じ限界を超えること。",
        isOn: false,
        sortIndex: sidx++
    },
    {
        name: "Markdown",
        prompt: "- Markdown形式で章立てて記述すること。",
        isOn: false,
        sortIndex: sidx++
    },
    {
        name: "KaTeX",
        prompt: '- 計算手順として数式を記載する場合はKaTeX形式で記述すること。ブロックとして書く場合は `$$(改行)(数式)(改行)$$` のように `$$` で囲み、インラインで書く場合は ` $(数式)$ ` のように `$` で囲んで空白を開けること。',
        isOn: false,
        sortIndex: sidx++
    },
    {
        name: "Summarize",
        prompt: "ここまでの議論を要約してください。",
        isOn: false,
        sortIndex: sidx++
    },
    {
        name: "Draw a Decision ",
        prompt: "これらの回答を総合的に評価し、最終的な回答を出してください。",
        isOn: false,
        sortIndex: sidx++
    },
    {
        name: "Self Refine",
        prompt: "今のあなたの回答をフィードバックし、その結果を考慮して回答を修正してください。",
        isOn: false,
        sortIndex: sidx++
    },
    {
        name: "Translate to English",
        prompt: "------------\n上記を英語に翻訳してください。",
        isOn: false,
        sortIndex: sidx++
    },
    {
        name: "Program of Thoughts",
        prompt: "答えを導き出すためのPythonのコードを出力してください。",
        isOn: false,
        sortIndex: sidx++
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

    add: async (ins?: Omit<PresetPrompt, "id" | "sortIndex">) => {
        const maxSortIndex = (await db.presetPrompts.toArray() || []).map(p => p.sortIndex).reduce((a, b) => Math.max(a, b), -1);
        if (ins) {
            return db.presetPrompts.add({ ...ins, sortIndex: maxSortIndex + 1 });
        } else {
            return db.presetPrompts.add({ name: "New Preset", prompt: "New Preset", isOn: false, sortIndex: maxSortIndex + 1 });
        }
    },
    /**
     * 設定をデータベースに保存します。
     *
     */
    update: (id: number, pre: UpdateSpec<InsertType<PresetPrompt, "id">>) => db.presetPrompts.update(id, pre),

    remove: (id: number) => db.presetPrompts.delete(id),

    restore: () => {
        db.transaction('rw', db.presetPrompts, async () => {
            await db.presetPrompts.clear();
            await addDefaults(db);
        })
    }
})
export default presetPromptsStore;


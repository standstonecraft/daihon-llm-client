import { InjectionKey } from "vue";

export const injectionKeys = {
    OrClient: {
        /** InjectionKey エラーメッセージ表示 */
        showErrorDialog: Symbol() as InjectionKey<(text: string) => void>
    },
    OrClientChat: {
        /** InjectionKey チャットを送信する */
        sendChat: Symbol() as InjectionKey<(chatId: number, agentIds?: number[]) => Promise<void>>,
        /**
         * InjectionKey チャット待機開始
         * @param color ローダーの色 default: "primary"
         */
        startChatWaiting: Symbol() as InjectionKey<(color?: string) => void>,
        /**
         * InjectionKey チャット待機停止
         */
        stopChatWaiting: Symbol() as InjectionKey<() => void>,
    }
};
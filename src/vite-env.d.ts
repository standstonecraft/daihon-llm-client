/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

/**
 * Vite environment variables
 * .env ファイルに定義された値の型定義
 * https://ja.vitejs.dev/guide/env-and-mode.html
 */
interface ImportMetaEnv {
  readonly VITE_SHORT_NAME: string
  readonly VITE_NAME: string
  readonly VITE_VERSION: string
  readonly VITE_HOMEPAGE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
# Daihon LLM Client

## 概要

Daihon は、 [OpenRouter](https://openrouter.ai/) を利用して複数のLLMモデルを用いた柔軟なチャットを支援するアプリケーションです。

[Github Pages](https://standstonecraft.github.io/daihon-llm-client/) に公開してありますので、ご自由にお使いください。

## 要求

- APIキー
  - [OpenRouter](https://openrouter.ai/) アカウントを作成し、APIキーを作成しておく必要があります。
  - 作成したAPIキーは Config 画面に入力してください。
- ブラウザ
  - 最新の Google Chrome または Microsoft edge を使用してください。

## 特徴

- チャット
  - Open AI の ChatGPT に近い使用感
  - 画像送信 (対応モデルのみ)
- メッセージ履歴
  - ユーザーとアシスタントのメッセージ履歴の削除・編集
- モデル管理
  - 使用するモデルの管理・切り替え
  - 複数モデルへの同時送信
- プリセット プロンプト
  - よく使うプロンプトの保存
- 出力フォーマット
  - Markdown サポート
  - コードハイライト
  - KaTex (数式) サポート」

## ユースケース

- 意見の取りまとめ
  - 複数のモデルに質問を送信する
  - 回答を統合して最終的な結論を出させる
- 台本の修正
  - アシスタントの誤解を解くために、ユーザーまたはアシスタントのメッセージ履歴を編集して再送信する
- トークンの節約
  - 議論を途中で要約させ、過去のメッセージを削除してトークンを節約する

## 開発

[GitHub](https://github.com/StandstoneCraft/daihon-llm-client)

bun を使用しています。 yarn など他のマネージャーを使用する場合は、ロックファイルを削除してモジュールを最新にしてください。
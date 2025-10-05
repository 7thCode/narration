# Narration Editor

OpenAI Text-to-Speech APIを統合したテキストエディタ

## 機能

- ✅ テキストファイルの読み込み・保存
- ✅ 選択範囲の音声変換（OpenAI gpt-4o-mini-tts）
- ✅ 1024文字ごとの自動チャンク分割
- ✅ 8種類のボイス選択（Alloy, Echo, Fable, Onyx, Nova, Shimmer, Coral, Sage）
- ✅ カスタムインストラクション（声のトーン・スタイル調整）
- ✅ プログレスバー表示
- ✅ キャンセル機能
- ✅ 連番付きMP3ファイル出力（`output_timestamp_001.mp3`）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定（開発時のみ）

開発時は`.env`ファイルでAPI Keyを管理できます：

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```
OPENAI_API_KEY=sk-your-api-key-here
```

**注意**: パッケージ化されたアプリでは`.env`ファイルは使用されません。初回起動時にAPI Key入力ダイアログが表示され、`~/.narration-editor/settings.json`に保存されます。

### 3. 開発サーバー起動

```bash
npm run dev
```

別のターミナルでElectronを起動：

```bash
npm start
```

## 使い方

### 初回起動時

1. **API Key設定**
   - アプリ起動時にAPI Key入力ダイアログが表示されます
   - OpenAI API Keyを入力して「保存」をクリック
   - API Keyは `~/.narration-editor/settings.json` に安全に保存されます
   - 後から変更する場合は「API Key設定」ボタンから再設定可能

### 基本的な使い方

1. **テキストファイルの読み込み**
   - 「ファイルを開く」ボタンをクリック
   - `.txt`ファイルを選択
   - または、テキストエリアに直接入力

2. **音声変換の設定**
   - サイドバーでVoiceを選択（Alloy, Echo, Fable, Onyx, Nova, Shimmer, Coral, Sage）
   - Instructions欄に音声のトーン・スタイルを入力（任意）
     ```
     例: Friendly, clear, and reassuring tone...
     ```

3. **テキストを音声に変換**
   - エディタ内で変換したいテキストを選択
   - 「選択範囲を音声に変換」ボタンをクリック
   - プログレスバーで進捗を確認
   - キャンセルする場合は「キャンセル」ボタンをクリック

4. **音声ファイルの確認**
   - 変換完了後、`~/Downloads/narration/` に自動保存
   - ファイル名形式: `[ファイル名][開始行数]_[連番].mp3`
     - 例: `sample23_001.mp3`（sample.txtの23行目から選択、1番目のチャンク）
   - ファイルを開いていない場合: `untitled[開始行数]_[連番].mp3`
   - 1024文字を超える場合は自動的に分割され、連番で複数ファイルが生成されます

5. **音声の再生**
   - 変換完了後、サイドバーに音声プレイヤーが表示されます
   - 各MP3ファイルを個別に再生可能

### ファイルの保存

- 「ファイルを保存」ボタンで編集中のテキストを保存できます

## ビルド・パッケージング

### 開発ビルド

```bash
npm run build
npm start
```

### アプリケーションパッケージング

Mac用DMGファイルを作成：

```bash
npm run package
```

生成物: `release/Narration Editor-1.0.0-universal.dmg`（Intel + Apple Silicon対応）

**初回起動時の注意**:
- コード署名なしのアプリケーションのため、Macのセキュリティ設定で警告が表示される場合があります
- 「システム環境設定」→「セキュリティとプライバシー」から許可が必要な場合があります

### API Key設定の仕組み

アプリケーションは以下の優先順位でAPI Keyを読み込みます：

1. **環境変数** `OPENAI_API_KEY`（開発時のみ）
2. **設定ファイル** `~/.narration-editor/settings.json`（パッケージ版）

パッケージ化されたアプリでは：
- 初回起動時にAPI Key入力ダイアログが自動表示
- 入力されたAPI Keyは`~/.narration-editor/settings.json`に保存
- 次回起動時は自動的に読み込まれます
- ヘッダーの「API Key設定」ボタンからいつでも再設定可能

## プロジェクト構造

```
narration-editor/
├── src/
│   ├── main/              # Electron Main Process
│   │   ├── index.ts       # エントリーポイント
│   │   ├── preload.ts     # Preloadスクリプト
│   │   ├── ipc/
│   │   │   ├── file.ts    # ファイル操作
│   │   │   └── tts.ts     # TTS変換
│   │   └── utils/
│   │       └── textChunker.ts  # テキスト分割
│   └── renderer/          # UI
│       ├── index.html
│       └── app.ts
├── package.json
├── tsconfig.json
└── .env
```

## 技術スタック

- Electron 28
- TypeScript 5
- OpenAI SDK 4.73
- Vite 5
- dotenv

## ライセンス

MIT

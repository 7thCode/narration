# Narration Editor - 開発記録

## プロジェクト概要

OpenAI Text-to-Speech APIを統合したElectronベースのテキストエディタ。選択したテキストを音声ファイル（MP3）に変換する機能を提供。

## 技術スタック

- **フレームワーク**: Electron 28
- **言語**: TypeScript 5.3
- **UI**: HTML5 + CSS (ダークテーマ)
- **ビルドツール**: TypeScript Compiler, electron-builder
- **主要ライブラリ**:
  - `openai` (OpenAI SDK)
  - `dotenv` (環境変数管理)

## 開発経過

### Phase 1: プロジェクト初期化とブレインストーミング

**要件定義**
- テキストファイルの読み込み・保存
- 選択範囲の音声変換（OpenAI TTS）
- 8種類のボイス選択（Alloy, Echo, Fable, Onyx, Nova, Shimmer, Coral, Sage）
- カスタムインストラクション（声のトーン・スタイル調整）
- プログレスバー表示とキャンセル機能
- 連番付きMP3ファイル出力

**技術選定**
- Mac専用アプリケーション
- Electron（クロスプロセスアーキテクチャ）
- 1024文字ごとの自動チャンク分割
- 音声ファイル形式: MP3（WAVから変更）

### Phase 2: 基本構造の実装

**ディレクトリ構造**
```
src/
├── main/                    # Electron Main Process
│   ├── index.ts            # App entry point
│   ├── preload.ts          # IPC bridge (CommonJS)
│   ├── ipc/
│   │   ├── file.ts         # File I/O operations
│   │   ├── tts.ts          # OpenAI TTS integration
│   │   └── settings.ts     # API Key management
│   └── utils/
│       └── textChunker.ts  # Text splitting (1024 chars)
└── renderer/               # React UI
    ├── index.html          # UI layout
    └── app.ts              # Frontend logic
```

**実装した機能**
1. ファイル操作（開く・保存）
2. テキストエディタ（シンプルなtextarea）
3. TTS変換ロジック（OpenAI API統合）
4. チャンク分割（1024文字上限）
5. プログレスバー + キャンセル機能

### Phase 3: モジュール設定の修正

**課題と解決**
- **問題**: CommonJS vs ES Module の競合
- **解決策**:
  - Main Process: ES Module (`tsconfig.main.json`)
  - Preload Script: CommonJS (`tsconfig.preload.json`)
  - Renderer: ES Module (`tsconfig.json`)
  - `package.json`に`"type": "module"`を追加
  - `__dirname`の代替実装（ES Module用）

**import文の修正**
- ES Moduleでは拡張子`.js`が必須
- 例: `import { splitText } from '../utils/textChunker.js'`

### Phase 4: ファイル命名とパス管理

**保存先の仕様**
- デフォルトディレクトリ: `~/Downloads/narration/`
- ファイル名形式: `[ファイル名][開始行数]_[連番].mp3`
  - 例: `sample23_001.mp3`（sample.txtの23行目から選択、1番目のチャンク）
- ファイル未選択時: `untitled[開始行数]_[連番].mp3`

**実装詳細**
- 選択開始位置の行数を計算
- ディレクトリの自動作成（`mkdirSync`）
- グローバル変数`currentFilePath`で開いているファイルを管理

### Phase 5: API Key管理システム

**課題**: パッケージ化されたアプリでは`.env`ファイルが読み込めない

**解決策**:
1. 設定ファイルシステムの実装
   - 保存先: `~/.narration-editor/settings.json`
   - API Key, その他の設定を永続化

2. UI実装
   - 初回起動時にAPI Key入力モーダルを表示
   - ヘッダーに「API Key設定」ボタンを追加
   - パスワード形式の入力フィールド

3. 優先順位
   - 環境変数 `OPENAI_API_KEY` > 設定ファイル

### Phase 6: パッケージング

**electron-builderの設定**
```json
{
  "build": {
    "appId": "com.narration.editor",
    "productName": "Narration Editor",
    "mac": {
      "category": "public.app-category.productivity",
      "target": [{"target": "dmg", "arch": ["universal"]}]
    }
  }
}
```

**生成物**
- `release/Narration Editor-1.0.0-universal.dmg`
- Universal Binary（Intel + Apple Silicon対応）

**注意事項**
- コード署名なし（開発用証明書期限切れ）
- 初回起動時にセキュリティ警告が表示される可能性

### Phase 7: UI/UX改善

**音声再生機能**
- 変換完了後にサイドバーに音声プレイヤーを表示
- HTML5 `<audio>` コントロールで個別再生

**デバッグ環境**
- 開発時: DevToolsを自動表示（後に無効化）
- console.logでデバッグ情報を出力

### Phase 8: テキスト処理機能の追加

**実装した機能**
1. **漢字抽出ボタン** (`kanjiButton`)
   - 選択範囲から漢字のみを抽出
   - 正規表現: `/[\u4e00-\u9faf]/g`

2. **ふりがな抽出ボタン** (`furiganaButton`)
   - 選択範囲からひらがなのみを抽出
   - 正規表現: `/[\u3040-\u309f]/g`

3. **改行変換ボタン** (`brConvertButton`)
   - `<br />` タグを実際の改行文字に変換
   - HTML形式のテキストを通常のテキストに変換

4. **ルビ変換ボタン** (`rubyConvertButton`)
   - HTMLルビタグを「漢字（ふりがな）」形式に変換
   - 変換前: `<ruby><rb>漢字</rb><rp>（</rp><rt>かんじ</rt><rp>）</rp></ruby>`
   - 変換後: `漢字（かんじ）`
   - 正規表現: `/<ruby><rb>(.*?)<\/rb><rp>（<\/rp><rt>(.*?)<\/rt><rp>）<\/rp><\/ruby>/g`

**UI配置**
- ヘッダー部分に4つのテキスト処理ボタンを追加
- 配置順: 漢字 | ふりがな | 改行変換 | ルビ変換 | API Key設定

**技術的詳細**
- 各ボタンは選択範囲または全体のテキストを処理
- 処理後にステータスメッセージを表示（成功時: `success`）
- `editor.value` を直接書き換える方式で実装

**ユースケース**
- 青空文庫など、ルビ付きテキストの処理
- TTS用のテキスト前処理（ルビタグの除去）
- 漢字・ひらがなの学習用抽出

## 技術的な学び

### Electronのプロセス間通信（IPC）

**Main Process → Renderer Process**
```typescript
// Main
event.sender.send('tts:progress', { current: i, total: chunks.length });

// Renderer
ipcRenderer.on('tts:progress', (_event, progress) => callback(progress));
```

**Renderer Process → Main Process**
```typescript
// Renderer
await ipcRenderer.invoke('tts:convert', params);

// Main
ipcMain.handle('tts:convert', async (event, params) => { ... });
```

### ES Module環境での課題

1. **`__dirname`が使えない**
   ```typescript
   import { fileURLToPath } from 'url';
   import { dirname } from 'path';
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = dirname(__filename);
   ```

2. **import文に拡張子が必須**
   ```typescript
   import { splitText } from '../utils/textChunker.js';
   ```

3. **Preloadスクリプトは CommonJS**
   - `contextBridge`はCommonJS環境でのみ動作
   - 別途`tsconfig.preload.json`でビルド

### OpenAI TTS API統合

**チャンク分割の実装**
- 改行を保持しながら1024文字ごとに分割
- 長い行は文字単位で強制分割
- `splitText()` ユーティリティ関数

**AbortController によるキャンセル**
```typescript
let abortController = new AbortController();

// API呼び出し時
await openai.audio.speech.create({
  ...params,
  signal: abortController.signal
});

// キャンセル時
abortController.abort();
```

## 未実装機能・今後の拡張案

### 優先度: 高
- [ ] 使用量トラッキング表示（OpenAI APIレスポンスから）
- [ ] エラーハンドリングの強化
- [ ] ファイル保存先のカスタマイズUI

### 優先度: 中
- [ ] 音声速度・ピッチ調整（Web Audio API）
- [ ] バッチ処理（複数選択の一括変換）
- [ ] 最近使用したファイルのリスト
- [ ] テーマカスタマイズ

### 優先度: 低
- [ ] マークダウンプレビュー
- [ ] シンタックスハイライト
- [ ] 複数ファイルの同時編集
- [ ] クラウド同期

## ファイル構成

```
narration-editor/
├── src/
│   ├── main/
│   │   ├── index.ts               # Electronエントリーポイント
│   │   ├── preload.ts             # IPC通信設定
│   │   ├── ipc/
│   │   │   ├── file.ts            # ファイル操作
│   │   │   ├── tts.ts             # TTS変換
│   │   │   └── settings.ts        # API Key管理
│   │   └── utils/
│   │       └── textChunker.ts     # テキスト分割
│   └── renderer/
│       ├── index.html              # UI
│       ├── app.ts                  # フロントエンドロジック
│       └── types.ts                # 型定義
├── dist/                           # ビルド出力
├── release/                        # パッケージング出力
├── package.json
├── tsconfig.json                   # Renderer用
├── tsconfig.main.json              # Main Process用
├── tsconfig.preload.json           # Preload用
├── .env                            # API Key（開発用）
├── .gitignore
└── README.md
```

## ビルドコマンド

```bash
# 開発モード
npm run build        # TypeScriptコンパイル
npm start            # Electron起動

# パッケージング
npm run package      # DMG生成
```

## 設定ファイル

### `.env` (開発用)
```
OPENAI_API_KEY=sk-...
```

### `~/.narration-editor/settings.json` (本番用)
```json
{
  "apiKey": "sk-..."
}
```

## トラブルシューティング履歴

1. **問題**: `exports is not defined`
   - **原因**: CommonJSとES Moduleの混在
   - **解決**: `tsconfig.json`の`module`を`ES2020`に変更

2. **問題**: `Cannot use import statement outside a module`
   - **原因**: `package.json`に`"type": "module"`がない
   - **解決**: `package.json`に追加

3. **問題**: `__dirname is not defined`
   - **原因**: ES Moduleでは`__dirname`が使えない
   - **解決**: `fileURLToPath(import.meta.url)`で代替

4. **問題**: `Cannot find module 'textChunker'`
   - **原因**: ES Moduleでは拡張子が必須
   - **解決**: import文に`.js`を追加

5. **問題**: ボタンが動作しない
   - **原因**: DOMContentLoaded前にイベントリスナーを登録
   - **解決**: `DOMContentLoaded`イベント内で`initApp()`を呼び出し

6. **問題**: パッケージ版でAPI Keyが読み込めない
   - **原因**: `.env`ファイルがパッケージに含まれない
   - **解決**: 設定ファイルシステムとAPI Key入力UIを実装

## まとめ

Electronアプリケーションの開発において、ES ModuleとCommonJSの混在、プロセス間通信、パッケージング時の環境変数管理など、多くの技術的課題に直面したが、すべて解決し、完全に動作するアプリケーションを完成させた。

OpenAI TTS APIの統合により、テキストから高品質な音声を生成できるようになり、1024文字の自動分割、プログレス表示、キャンセル機能など、UXにも配慮した実装となった。

今後は使用量トラッキングやUI/UXの更なる改善を進める予定。

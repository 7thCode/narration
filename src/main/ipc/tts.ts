import { ipcMain } from 'electron';
import OpenAI from 'openai';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { splitText } from '../utils/textChunker.js';
import { cleanMarkdown } from '../utils/markdownCleaner.js';
import { currentFilePath } from './file.js';
import { getApiKey } from './settings.js';
import { getTempDir } from './file-manager.js';

let abortController: AbortController | null = null;

interface TTSParams {
  text: string;
  voice: string;
  instructions: string;
  startLine: number;
}

ipcMain.handle('tts:convert', async (event, params: TTSParams) => {
  abortController = new AbortController();

  try {
    // API Key取得
    const apiKey = getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API Keyが設定されていません' };
    }

    // OpenAIクライアント作成
    const openai = new OpenAI({ apiKey });

    // Markdownファイルの場合は記号を削除
    const isMarkdownFile = currentFilePath?.endsWith('.md') || false;
    const processedText = isMarkdownFile ? cleanMarkdown(params.text) : params.text;

    // テキストを1024文字ごとに分割
    const chunks = splitText(processedText, 1024);
    const generatedFiles: string[] = [];

    // 保存先ディレクトリの決定（一時ディレクトリ）
    const baseDir = getTempDir();

    // ファイル名のベース部分を決定
    let fileBaseName = 'untitled';
    if (currentFilePath) {
      const pathParts = currentFilePath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      fileBaseName = fileName.replace(/\.[^/.]+$/, ''); // 拡張子を削除
    }

    console.log(`テキストを${chunks.length}個のチャンクに分割しました`);
    console.log(`一時保存先: ${baseDir}`);

    for (let i = 0; i < chunks.length; i++) {
      // キャンセルチェック
      if (abortController.signal.aborted) {
        return { success: false, error: 'Cancelled' };
      }

      console.log(`チャンク ${i + 1}/${chunks.length} を変換中...`);

      // OpenAI TTS API呼び出し
      const mp3 = await openai.audio.speech.create({
        model: 'gpt-4o-mini-tts',
        voice: params.voice as any,
        instructions: params.instructions,
        input: chunks[i],
      });

      // MP3データをバッファに変換
      const buffer = Buffer.from(await mp3.arrayBuffer());

      // ファイル名生成: [ファイル名][開始行数]_[連番].mp3
      const filename = `${fileBaseName}${params.startLine}_${String(i + 1).padStart(3, '0')}.mp3`;
      const filepath = join(baseDir, filename);

      // ファイルに保存
      writeFileSync(filepath, buffer);

      generatedFiles.push(filepath);
      console.log(`✅ ${filename} 保存完了 (${buffer.length} bytes)`);

      // 進捗通知
      event.sender.send('tts:progress', {
        current: i + 1,
        total: chunks.length,
      });
    }

    return {
      success: true,
      files: generatedFiles,
      totalChunks: chunks.length,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Cancelled' };
    }
    console.error('❌ TTS変換エラー:', error);
    return { success: false, error: error.message };
  } finally {
    abortController = null;
  }
});

ipcMain.on('tts:cancel', () => {
  if (abortController) {
    abortController.abort();
    console.log('⚠️ TTS変換をキャンセルしました');
  }
});

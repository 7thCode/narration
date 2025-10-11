import { ipcMain } from 'electron';
import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Goバイナリのパス（開発時とパッケージ後で異なる）
function getGoBinaryPath(): string {
  // パッケージ化されたアプリの場合
  if (process.resourcesPath && !process.defaultApp) {
    return join(process.resourcesPath, 'binaries', 'kanji_converter');
  }
  // 開発環境の場合: dist/main/ipc/ から dist/binaries/ へ
  // __dirname = .../dist/main/ipc
  return join(__dirname, '..', '..', 'binaries', 'kanji_converter');
}

interface ConvertResult {
  success: boolean;
  output?: string;
  error?: string;
}

// 漢字→ひらがな変換（Go + Kagome）
ipcMain.handle('go:convertToHiragana', async (_event, text: string): Promise<ConvertResult> => {
  const binaryPath = getGoBinaryPath();

  console.log('[Go] Executing conversion:');
  console.log('  Binary path:', binaryPath);
  console.log('  __dirname:', __dirname);
  console.log('  process.resourcesPath:', process.resourcesPath);
  console.log('  process.defaultApp:', process.defaultApp);

  try {
    return await new Promise((resolve, reject) => {
      const goProcess = spawn(binaryPath);
      let stdout = '';
      let stderr = '';

      // タイムアウト設定（10秒）
      const timeout = setTimeout(() => {
        goProcess.kill();
        reject(new Error('Conversion timeout (10s exceeded)'));
      }, 10000);

      // 標準出力
      goProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      // 標準エラー
      goProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // プロセス終了
      goProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolve({ success: true, output: stdout });
        } else {
          resolve({ success: false, error: stderr || 'Go binary execution failed' });
        }
      });

      // プロセスエラー
      goProcess.on('error', (err) => {
        clearTimeout(timeout);
        resolve({ success: false, error: `Failed to execute binary: ${err.message}` });
      });

      // 入力テキストを標準入力に送信
      goProcess.stdin.write(text);
      goProcess.stdin.end();
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

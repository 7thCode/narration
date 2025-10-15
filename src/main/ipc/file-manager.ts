import { ipcMain } from 'electron';
import { copyFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join, basename, extname } from 'path';
import { homedir, tmpdir } from 'os';

// 一時ディレクトリのパス
export function getTempDir(): string {
  // Macの場合は ~/Library/Caches/narration-editor/
  const cacheDir = join(homedir(), 'Library', 'Caches', 'narration-editor');

  // ディレクトリが存在しなければ作成
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }

  return cacheDir;
}

// 最終保存先ディレクトリのパス
export function getFinalDir(): string {
  const finalDir = join(homedir(), 'Downloads', 'narration');

  if (!existsSync(finalDir)) {
    mkdirSync(finalDir, { recursive: true });
  }

  return finalDir;
}

// ファイル名の重複チェックと連番付与
function getUniqueFilename(dir: string, filename: string): string {
  const ext = extname(filename);
  const name = basename(filename, ext);

  let counter = 1;
  let uniqueFilename = filename;

  // 重複している間、連番を増やす
  while (existsSync(join(dir, uniqueFilename))) {
    uniqueFilename = `${name}(${counter})${ext}`;
    counter++;
  }

  return uniqueFilename;
}

// 一時ファイルを最終保存先にコピー
ipcMain.handle('file-manager:save-temp-file', async (event, tempFilePath: string) => {
  try {
    const finalDir = getFinalDir();
    const filename = basename(tempFilePath);

    // 重複チェック
    const uniqueFilename = getUniqueFilename(finalDir, filename);
    const finalPath = join(finalDir, uniqueFilename);

    // ファイルコピー
    copyFileSync(tempFilePath, finalPath);

    console.log(`✅ 一時ファイルを保存: ${tempFilePath} → ${finalPath}`);

    return {
      success: true,
      finalPath,
      filename: uniqueFilename,
    };
  } catch (error: any) {
    console.error('❌ ファイル保存エラー:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// 一時ファイルを削除
ipcMain.handle('file-manager:delete-temp-file', async (event, tempFilePath: string) => {
  try {
    if (existsSync(tempFilePath)) {
      unlinkSync(tempFilePath);
      console.log(`🗑️ 一時ファイルを削除: ${tempFilePath}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('❌ ファイル削除エラー:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

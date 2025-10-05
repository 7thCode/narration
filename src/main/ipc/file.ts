import { ipcMain, dialog } from 'electron';
import { readFileSync, writeFileSync } from 'fs';

// currentFilePathをエクスポート用の変数として定義
export let currentFilePath: string | null = null;

ipcMain.handle('file:open', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'html'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'Cancelled' };
  }

  try {
    const filePath = result.filePaths[0];
    currentFilePath = filePath; // グローバル変数に保存
    const content = readFileSync(filePath, 'utf-8');
    return { success: true, content, filePath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:save', async (_event, content: string) => {
  const result = await dialog.showSaveDialog({
    filters: [
      { name: 'Text Files', extensions: ['txt', 'html'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, error: 'Cancelled' };
  }

  try {
    writeFileSync(result.filePath, content, 'utf-8');
    return { success: true, filePath: result.filePath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

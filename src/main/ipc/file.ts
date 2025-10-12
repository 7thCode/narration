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
  // 上書き保存: currentFilePathがあればそれを使用
  if (currentFilePath) {
    try {
      writeFileSync(currentFilePath, content, 'utf-8');
      return { success: true, filePath: currentFilePath };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  // currentFilePathがなければSave As扱い
  return handleSaveAs(content);
});

ipcMain.handle('file:saveAs', async (_event, content: string) => {
  return handleSaveAs(content);
});

async function handleSaveAs(content: string) {
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
    currentFilePath = result.filePath; // 保存後にcurrentFilePathを更新
    writeFileSync(result.filePath, content, 'utf-8');
    return { success: true, filePath: result.filePath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}



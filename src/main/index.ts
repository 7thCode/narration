import { app, BrowserWindow, ipcMain } from 'electron';
import { createApplicationMenu } from './menu.js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES Module用の__dirname定義
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 環境変数読み込み
dotenv.config();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // HTMLファイルを直接読み込み
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // アプリケーションメニューを作成
  createApplicationMenu(mainWindow);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
import './ipc/file.js';
import './ipc/tts.js';
import './ipc/settings.js';
import './ipc/go-converter.js';
import './ipc/file-manager.js';
import { registerDictionaryHandlers } from './ipc/dictionary.js';

// Register dictionary handlers
registerDictionaryHandlers();

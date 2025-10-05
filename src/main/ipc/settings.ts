import { ipcMain } from 'electron';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const SETTINGS_DIR = join(homedir(), '.narration-editor');
const SETTINGS_FILE = join(SETTINGS_DIR, 'settings.json');

interface Settings {
  apiKey?: string;
}

// 設定ディレクトリ作成
import { mkdirSync } from 'fs';
if (!existsSync(SETTINGS_DIR)) {
  mkdirSync(SETTINGS_DIR, { recursive: true });
}

// 設定読み込み
export function loadSettings(): Settings {
  if (!existsSync(SETTINGS_FILE)) {
    return {};
  }
  try {
    const data = readFileSync(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// 設定保存
function saveSettings(settings: Settings): void {
  writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// API Key取得
export function getApiKey(): string | undefined {
  // 環境変数を優先
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }
  // 設定ファイルから読み込み
  const settings = loadSettings();
  return settings.apiKey;
}

ipcMain.handle('settings:getApiKey', () => {
  return getApiKey();
});

ipcMain.handle('settings:setApiKey', (_event, apiKey: string) => {
  const settings = loadSettings();
  settings.apiKey = apiKey;
  saveSettings(settings);
  return { success: true };
});

ipcMain.handle('settings:hasApiKey', () => {
  return !!getApiKey();
});

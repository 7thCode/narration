/**
 * IPC Handlers for Project Settings (Voice + Instructions + Dictionary)
 */

import { ipcMain, dialog } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

interface DictionaryEntry {
  from: string;
  to: string;
}

type Dictionary = DictionaryEntry[];

interface ProjectSettings {
  voice: string;
  instructions: string;
  dictionary: Dictionary;
}

/**
 * Validates dictionary data structure
 */
function isValidDictionary(data: unknown): data is Dictionary {
  if (!Array.isArray(data)) {
    return false;
  }

  return data.every(entry =>
    typeof entry === 'object' &&
    entry !== null &&
    'from' in entry &&
    'to' in entry &&
    typeof entry.from === 'string' &&
    typeof entry.to === 'string'
  );
}

/**
 * Validates project settings structure
 */
function isValidProjectSettings(data: unknown): data is ProjectSettings {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as any;

  return (
    typeof obj.voice === 'string' &&
    typeof obj.instructions === 'string' &&
    'dictionary' in obj &&
    isValidDictionary(obj.dictionary)
  );
}

/**
 * Converts legacy dictionary-only format to project settings
 */
function convertLegacyToProjectSettings(data: unknown): ProjectSettings | null {
  // If it's already project settings, return as-is
  if (isValidProjectSettings(data)) {
    return data as ProjectSettings;
  }

  // If it's a dictionary array, convert to project settings with defaults
  if (isValidDictionary(data)) {
    return {
      voice: 'sage',
      instructions: '',
      dictionary: data
    };
  }

  return null;
}

/**
 * Get default dictionary directory path
 */
function getDefaultDictionaryPath(): string {
  return path.join(os.homedir(), 'Downloads', 'narration');
}

/**
 * Register all project settings related IPC handlers
 */
export function registerDictionaryHandlers(): void {
  /**
   * Save project settings (voice + instructions + dictionary) to file
   */
  ipcMain.handle('project:save', async (_event, settings: ProjectSettings) => {
    try {
      const defaultPath = path.join(getDefaultDictionaryPath(), 'project_settings.json');

      // Show save dialog
      const result = await dialog.showSaveDialog({
        title: 'プロジェクト設定を保存',
        defaultPath,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return { success: false, message: 'キャンセルされました' };
      }

      // Ensure directory exists
      const dir = path.dirname(result.filePath);
      await fs.mkdir(dir, { recursive: true });

      // Save project settings as formatted JSON
      await fs.writeFile(
        result.filePath,
        JSON.stringify(settings, null, 2),
        'utf-8'
      );

      return {
        success: true,
        message: 'プロジェクト設定を保存しました',
        filePath: result.filePath
      };
    } catch (error) {
      console.error('Failed to save project settings:', error);
      return {
        success: false,
        message: `保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      };
    }
  });

  /**
   * Load project settings from file (with backward compatibility for dictionary-only files)
   */
  ipcMain.handle('project:load', async (_event) => {
    try {
      const defaultPath = getDefaultDictionaryPath();

      // Show open dialog
      const result = await dialog.showOpenDialog({
        title: 'プロジェクト設定を読み込み',
        defaultPath,
        properties: ['openFile'],
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, message: 'キャンセルされました' };
      }

      const filePath = result.filePaths[0];

      // Read and parse JSON file
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Convert legacy format or validate project settings
      const settings = convertLegacyToProjectSettings(data);

      if (!settings) {
        return {
          success: false,
          message: '無効なファイル形式です。プロジェクト設定または辞書のJSON形式を確認してください。'
        };
      }

      // Determine if it was a legacy file
      const isLegacy = isValidDictionary(data) && !isValidProjectSettings(data);
      const message = isLegacy
        ? `辞書を読み込みました (${settings.dictionary.length}エントリ) - Voice/Instructionsはデフォルト値です`
        : `プロジェクト設定を読み込みました (辞書: ${settings.dictionary.length}エントリ)`;

      return {
        success: true,
        message,
        settings,
        filePath
      };
    } catch (error) {
      console.error('Failed to load project settings:', error);

      if (error instanceof SyntaxError) {
        return {
          success: false,
          message: 'JSONの解析に失敗しました。ファイル形式を確認してください。'
        };
      }

      return {
        success: false,
        message: `読み込みに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      };
    }
  });

}

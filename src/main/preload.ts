import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script loaded');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    on: (channel: string, callback: (...args: any[]) => void) => {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    },
  },
  file: {
    open: () => ipcRenderer.invoke('file:open'),
    save: (content: string) => ipcRenderer.invoke('file:save', content),
    saveAs: (content: string) => ipcRenderer.invoke('file:saveAs', content),
  },
  tts: {
    convert: (params: {
      text: string;
      voice: string;
      instructions: string;
      startLine: number;
    }) => ipcRenderer.invoke('tts:convert', params),
    cancel: () => ipcRenderer.send('tts:cancel'),
    onProgress: (callback: (progress: { current: number; total: number }) => void) => {
      ipcRenderer.on('tts:progress', (_event, progress) => callback(progress));
    },
  },
  settings: {
    hasApiKey: () => ipcRenderer.invoke('settings:hasApiKey'),
    getApiKey: () => ipcRenderer.invoke('settings:getApiKey'),
    setApiKey: (apiKey: string) => ipcRenderer.invoke('settings:setApiKey', apiKey),
  },
  go: {
    convertToHiragana: (text: string) => ipcRenderer.invoke('go:convertToHiragana', text),
  },
  fileManager: {
    saveTempFile: (tempFilePath: string) => ipcRenderer.invoke('file-manager:save-temp-file', tempFilePath),
    deleteTempFile: (tempFilePath: string) => ipcRenderer.invoke('file-manager:delete-temp-file', tempFilePath),
  },
  project: {
    save: (settings: { voice: string; instructions: string; dictionary: Array<{ from: string; to: string }> }) =>
      ipcRenderer.invoke('project:save', settings),
    load: () => ipcRenderer.invoke('project:load'),
  },
});


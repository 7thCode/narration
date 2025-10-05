import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script loaded');

contextBridge.exposeInMainWorld('electron', {
  file: {
    open: () => ipcRenderer.invoke('file:open'),
    save: (content: string) => ipcRenderer.invoke('file:save', content),
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
});


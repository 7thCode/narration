import { Menu, BrowserWindow, shell } from 'electron';

export function createApplicationMenu(mainWindow: BrowserWindow) {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    // App Menu (macOS only)
    ...(isMac ? [{
      label: 'Narration Editor',
      submenu: [
        {
          label: 'About Narration Editor',
          role: 'about' as const
        },
        { type: 'separator' as const },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit' as const
        }
      ]
    }] : []),

    // File Menu
    {
      label: 'File',
      submenu: [
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu:file:open');
          }
        },
        {
          label: 'Save...',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu:file:save');
          }
        },
        { type: 'separator' as const },
        ...(!isMac ? [{
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit' as const
        }] : [])
      ]
    },

    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo' as const
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo' as const
        },
        { type: 'separator' as const },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut' as const
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy' as const
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste' as const
        },
        { type: 'separator' as const },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectAll' as const
        }
      ]
    },

    // Tools Menu
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Extract main_text',
          accelerator: 'Shift+CmdOrCtrl+M',
          click: () => {
            mainWindow.webContents.send('menu:tools:maintext');
          }
        },
        {
          label: 'Extract Kanji',
          accelerator: 'Shift+CmdOrCtrl+K',
          click: () => {
            mainWindow.webContents.send('menu:tools:kanji');
          }
        },
        {
          label: 'Extract Furigana',
          accelerator: 'Shift+CmdOrCtrl+F',
          click: () => {
            mainWindow.webContents.send('menu:tools:furigana');
          }
        },
        {
          label: 'Convert BR Tags',
          accelerator: 'Shift+CmdOrCtrl+B',
          click: () => {
            mainWindow.webContents.send('menu:tools:br');
          }
        },
        {
          label: 'Convert Ruby Tags',
          accelerator: 'Shift+CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.send('menu:tools:ruby');
          }
        },
        {
          label: 'Convert to Hiragana',
          accelerator: 'Shift+CmdOrCtrl+H',
          click: () => {
            mainWindow.webContents.send('menu:tools:hiragana');
          }
        }
      ]
    },

    // View Menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Developer Tools',
          accelerator: isMac ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },

    // Window Menu
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize' as const
        },
        {
          label: 'Zoom',
          role: 'zoom' as const
        }
      ]
    },

    // Help Menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: async () => {
            await shell.openExternal('https://github.com/yourusername/narration-editor');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

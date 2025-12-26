const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the bundled React app
  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Create menu
  createMenu();
};

const createMenu = () => {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            newProject();
          }
        },
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            openFile();
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            saveFile();
          }
        },
        {
          label: 'Save As',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            saveFileAs();
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          click: () => {
            app.quit();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

let currentFilePath = null;

const newProject = () => {
  currentFilePath = null;
  const newProjectData = {
    projectName: 'New Project',
    LastSaveTime: null,
    ProjectStructure: {
      MainQuestion: {
        QuestionInput: '',
        ID: 'main-0',
        solution: '',
        children: []
      }
    }
  };
  mainWindow.webContents.send('file-opened', newProjectData);
};

const openFile = async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const fileData = fs.readFileSync(filePath, 'utf-8');
    currentFilePath = filePath;
    mainWindow.webContents.send('file-opened', JSON.parse(fileData));
  }
};

const saveFile = async () => {
  if (currentFilePath) {
    mainWindow.webContents.send('request-save-data');
  } else {
    saveFileAs();
  }
};

const saveFileAs = async () => {
  mainWindow.webContents.send('request-save-data');
};

ipcMain.on('save-data', async (event, data) => {
  if (!currentFilePath) {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      defaultPath: data.projectName || 'project'
    });

    if (!result.canceled && result.filePath) {
      currentFilePath = result.filePath;
    } else {
      return;
    }
  }

  // Update last save time
  data.LastSaveTime = new Date().toISOString();
  fs.writeFileSync(currentFilePath, JSON.stringify(data, null, 2));
  mainWindow.webContents.send('file-saved', { success: true, filePath: currentFilePath });
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

const { app, BrowserWindow, Menu, dialog, ipcMain, session } = require('electron');
const path = require('node:path');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

// Project management paths
const getProjectsDir = () => {
  const userDataPath = app.getPath('userData');
  const projectsDir = path.join(userDataPath, 'projects');
  if (!fs.existsSync(projectsDir)) {
    fs.mkdirSync(projectsDir, { recursive: true });
  }
  return projectsDir;
};

const getProjectFilePath = (projectId) => {
  return path.join(getProjectsDir(), `${projectId}.json`);
};

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

// Project Management IPC Handlers
const sendProjectsList = () => {
  const projectsDir = getProjectsDir();
  const files = fs.readdirSync(projectsDir);
  const projects = files
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const filePath = path.join(projectsDir, file);
      const stats = fs.statSync(filePath);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return {
        id: path.basename(file, '.json'),
        name: data.projectName || 'Untitled Project',
        lastModified: stats.mtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
  
  mainWindow.webContents.send('projects-updated', projects);
};

ipcMain.on('load-projects', (event) => {
  sendProjectsList();
});

ipcMain.on('create-project', (event, projectName) => {
  const projectId = `project_${Date.now()}`;
  const newProjectData = {
    projectName: projectName,
    LastSaveTime: new Date().toISOString(),
    ProjectStructure: {
      MainQuestion: {
        QuestionInput: '',
        ID: 'main-0',
        solution: '',
        children: []
      }
    }
  };
  
  const filePath = getProjectFilePath(projectId);
  fs.writeFileSync(filePath, JSON.stringify(newProjectData, null, 2));
  
  // Reload projects list
  sendProjectsList();
});

ipcMain.on('delete-project', (event, projectId) => {
  const filePath = getProjectFilePath(projectId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  sendProjectsList();
});

ipcMain.on('rename-project', (event, { id, newName }) => {
  const filePath = getProjectFilePath(id);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    data.projectName = newName;
    data.LastSaveTime = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
  sendProjectsList();
});

ipcMain.on('load-project', (event, projectId) => {
  const filePath = getProjectFilePath(projectId);
  if (fs.existsSync(filePath)) {
    const projectData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    mainWindow.webContents.send('project-loaded', { projectId, projectData });
  }
});

ipcMain.on('save-project-data', (event, { id, data }) => {
  const filePath = getProjectFilePath(id);
  data.LastSaveTime = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  mainWindow.webContents.send('file-saved', { success: true, filePath });
});

// PDF Export Handler
ipcMain.on('save-pdf', async (event, { pdfData, defaultFileName }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Solutions PDF',
    defaultPath: defaultFileName,
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
  });

  if (!result.canceled && result.filePath) {
    const buffer = Buffer.from(pdfData);
    fs.writeFileSync(result.filePath, buffer);
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Enable spell checker for the default session
  session.defaultSession.setSpellCheckerEnabled(true);
  session.defaultSession.setSpellCheckerLanguages(['en-US']);

  // Enable spell checker context menu with suggestions
  app.on('web-contents-created', (event, contents) => {
    contents.on('context-menu', (event, params) => {
      const { Menu, MenuItem } = require('electron');
      const menu = new Menu();

      // Add spelling suggestions if there are any
      if (params.misspelledWord) {
        params.dictionarySuggestions.forEach(suggestion => {
          menu.append(new MenuItem({
            label: suggestion,
            click: () => contents.replaceMisspelling(suggestion)
          }));
        });

        // Add separator if we have suggestions
        if (params.dictionarySuggestions.length > 0) {
          menu.append(new MenuItem({ type: 'separator' }));
        }

        // Add "Add to dictionary" option
        menu.append(new MenuItem({
          label: 'Add to Dictionary',
          click: () => contents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
        }));

        menu.append(new MenuItem({ type: 'separator' }));
      }

      // Add standard editing options
      if (params.isEditable) {
        menu.append(new MenuItem({ label: 'Cut', role: 'cut', enabled: params.editFlags.canCut }));
        menu.append(new MenuItem({ label: 'Copy', role: 'copy', enabled: params.editFlags.canCopy }));
        menu.append(new MenuItem({ label: 'Paste', role: 'paste', enabled: params.editFlags.canPaste }));
      }

      // Show the menu if it has items
      if (menu.items.length > 0) {
        menu.popup();
      }
    });
  });

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

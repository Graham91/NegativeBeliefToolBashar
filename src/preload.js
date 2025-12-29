// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Legacy file operations
  onFileOpened: (callback) => ipcRenderer.on('file-opened', (_event, data) => callback(_event, data)),
  onFileSaved: (callback) => ipcRenderer.on('file-saved', (_event, data) => callback(_event, data)),
  onRequestSaveData: (callback) => ipcRenderer.on('request-save-data', () => callback()),
  saveData: (data) => ipcRenderer.send('save-data', data),
  
  // Project management
  loadProjects: () => ipcRenderer.send('load-projects'),
  onProjectsUpdated: (callback) => ipcRenderer.on('projects-updated', (_event, data) => callback(_event, data)),
  createProject: (name) => ipcRenderer.send('create-project', name),
  deleteProject: (id) => ipcRenderer.send('delete-project', id),
  renameProject: (id, newName) => ipcRenderer.send('rename-project', { id, newName }),
  loadProject: (id) => ipcRenderer.send('load-project', id),
  onProjectLoaded: (callback) => ipcRenderer.on('project-loaded', (_event, data) => callback(_event, data)),
  saveProjectData: (id, data) => ipcRenderer.send('save-project-data', { id, data }),
  
  // PDF export
  savePDF: (pdfData, defaultFileName) => ipcRenderer.send('save-pdf', { pdfData, defaultFileName }),
  
  removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback)
});


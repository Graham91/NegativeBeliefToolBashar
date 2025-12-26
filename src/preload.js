// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onFileOpened: (callback) => ipcRenderer.on('file-opened', (_event, data) => callback(_event, data)),
  onFileSaved: (callback) => ipcRenderer.on('file-saved', (_event, data) => callback(_event, data)),
  onRequestSaveData: (callback) => ipcRenderer.on('request-save-data', () => callback()),
  saveData: (data) => ipcRenderer.send('save-data', data),
  removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback)
});

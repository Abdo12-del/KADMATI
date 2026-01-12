const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Expose a method to listen for backend port
  onBackendPort: (callback) => ipcRenderer.on('backend-port', (_event, port) => callback(port)),
  // Expose a method to send a signal to the main process for shutdown
  quitApp: () => ipcRenderer.send('quit-app'),
  onBackendError: (callback) => ipcRenderer.on('backend-error', (_event, message) => callback(message)),
  onBackendExit: (callback) => ipcRenderer.on('backend-exit', (_event, message) => callback(message)),
});
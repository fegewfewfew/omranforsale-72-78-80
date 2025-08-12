const { contextBridge, ipcRenderer } = require('electron');

try {
  contextBridge.exposeInMainWorld('electronAPI', {
    getMachineId: () => ipcRenderer.invoke('get-machine-id'),
    getDefaultBackupDir: () => ipcRenderer.invoke('get-default-backup-dir'),
    saveBackup: (backupId, json, dir) => ipcRenderer.invoke('save-backup', { backupId, json, dir }),
  });
} catch (e) {
  // In non-Electron environments
  // noop
}

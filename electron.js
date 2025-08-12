const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'electron-preload.js'),
      sandbox: false
    },
    icon: path.join(__dirname, 'public/favicon.ico'),
    show: false,
    titleBarStyle: 'default'
  });

  // تحميل التطبيق
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // إظهار النافذة عند جاهزيتها
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // التعامل مع إغلاق النافذة
  mainWindow.on('closed', () => {
    app.quit();
  });
}

// تطبيق جاهز
app.whenReady().then(() => {
  // Block all external requests (allow only file://, devtools, and localhost in dev)
  try {
    const allowRequest = (url) => {
      if (url.startsWith('file://') || url.startsWith('devtools://')) return true;
      if (isDev && (url.startsWith('http://localhost') || url.startsWith('ws://localhost'))) return true;
      return false;
    };

    if (session && session.defaultSession) {
      session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
        const allowed = allowRequest(details.url);
        if (!allowed) {
          return callback({ cancel: true });
        }
        return callback({ cancel: false });
      });
    }
  } catch (e) {
    console.error('Failed to set request blocking:', e);
  }

  // IPC handlers for backup and device fingerprint
  const computeMachineId = () => {
    try {
      const nets = os.networkInterfaces();
      const macs = Object.values(nets)
        .flat()
        .filter(Boolean)
        .map((n) => n.mac)
        .filter((m) => m && m !== '00:00:00:00:00:00');
      const idSource = [os.hostname(), os.arch(), os.platform(), os.release(), os.userInfo().username, ...macs].join('|');
      return crypto.createHash('sha256').update(idSource).digest('hex');
    } catch {
      return 'unknown-machine';
    }
  };

  const ensureBackupDir = () => {
    const base = app.getPath('documents'); // default to Documents
    const dir = path.join(base, 'OmranBackups');
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {}
    return dir;
  };

  // Enforce simple offline single-device lock (best-effort, offline)
  try {
    const lockDir = path.join(app.getPath('appData'), 'OmranApp');
    const lockFile = path.join(lockDir, 'device.lock.json');
    fs.mkdirSync(lockDir, { recursive: true });
    const currentId = computeMachineId();
    if (fs.existsSync(lockFile)) {
      const saved = JSON.parse(fs.readFileSync(lockFile, 'utf-8'));
      if (saved.machineId && saved.machineId !== currentId) {
        console.error('Device lock mismatch. Exiting.');
        app.quit();
        return;
      }
    } else {
      fs.writeFileSync(lockFile, JSON.stringify({ machineId: currentId, createdAt: new Date().toISOString() }, null, 2));
    }
  } catch (e) {
    console.warn('Device lock initialization warning:', e);
  }

  ipcMain.handle('get-machine-id', () => computeMachineId());

  ipcMain.handle('get-default-backup-dir', () => ensureBackupDir());

  ipcMain.handle('save-backup', async (_event, { backupId, json, dir }) => {
    try {
      const targetDir = dir && typeof dir === 'string' ? dir : ensureBackupDir();
      fs.mkdirSync(targetDir, { recursive: true });
      const filePath = path.join(targetDir, `${backupId}.json`);

      // Validate JSON and checksum before writing
      const obj = JSON.parse(json);
      if (!obj || !obj.metadata || !obj.data) {
        throw new Error('Invalid backup structure');
      }
      const dataString = JSON.stringify(obj.data);
      const checksum = crypto.createHash('sha256').update(dataString).digest('hex');
      if (checksum !== obj.metadata.checksum) {
        throw new Error('Checksum mismatch');
      }

      // Write atomically: temp then rename
      const tmpPath = filePath + '.tmp';
      fs.writeFileSync(tmpPath, json);
      fs.renameSync(tmpPath, filePath);

      return { success: true, path: filePath };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// إنهاء التطبيق عند إغلاق جميع النوافذ
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// منع عدة مثيلات من التطبيق
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
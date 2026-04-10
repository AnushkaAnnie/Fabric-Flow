const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'FabricFlow',
    autoHideMenuBar: true
  });

  // Check if we are in development mode
  const isDev = !app.isPackaged;

  if (isDev) {
    // Wait for vite to start
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:5173');
      mainWindow.webContents.openDevTools();
    }, 3000);
  } else {
    // In production, we load the built static files
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
}

function startBackend() {
  const backendPath = path.join(__dirname, '../backend/src/server.js');
  
  // Start node process for the backend
  backendProcess = spawn('node', [backendPath], {
    env: {
      ...process.env,
      NODE_ENV: app.isPackaged ? 'production' : 'development',
      PORT: '3001',
      DATABASE_URL: `file:${path.join(app.getPath('userData'), 'database.sqlite')}`
    }
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend Server: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });
}

app.whenReady().then(() => {
  // Start the local offline backend first
  startBackend();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  // Kill backend when app closes
  if (backendProcess) {
    backendProcess.kill();
  }
});

import { app, BrowserWindow, ipcMain } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import url from 'url';
import fs from 'fs';
import net from 'net'; // Import net for port finding

let mainWindow: BrowserWindow | null;
let backendProcess: ChildProcess | null = null;
const BACKEND_PORT_START = 3001; // Start searching for a free port from here

const isDev = process.env.NODE_ENV === 'development';
const backendPath = path.join(__dirname, '..', 'backend'); // Path to your backend folder

// Function to find a free port
function findFreePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        server.close();
        resolve(findFreePort(startPort + 1)); // Try next port
      } else {
        reject(err);
      }
    });
    server.once('listening', () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close();
      resolve(port);
    });
    server.listen(startPort);
  });
}

async function startBackend() {
  try {
    const portToUse = await findFreePort(BACKEND_PORT_START);
    console.log(`Backend will run on port: ${portToUse}`);

    const backendEntry = path.join(backendPath, 'server.ts'); // For dev with tsx
    const backendDistEntry = path.join(backendPath, 'dist', 'server.js'); // For production with compiled JS

    let command: string;
    let args: string[];

    if (isDev) {
      // In development, use tsx to run the TypeScript backend directly
      command = 'tsx';
      args = [backendEntry];
    } else {
      // In production, ensure the backend is compiled to JS and run with node
      if (!fs.existsSync(backendDistEntry)) {
        console.error(`Backend production entry not found: ${backendDistEntry}`);
        throw new Error('Backend not compiled for production.');
      }
      command = 'node';
      args = [backendDistEntry];
    }

    backendProcess = spawn(command, args, {
      cwd: backendPath,
      env: {
        ...process.env,
        PORT: portToUse.toString(),
        NODE_ENV: isDev ? 'development' : 'production',
      },
      detached: !isDev, // Detach in production for hidden process
      windowsHide: !isDev, // Hide window on Windows in production
      stdio: isDev ? 'inherit' : 'ignore', // Show stdio in dev, hide in production
    });

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend process:', err);
      if (!mainWindow?.isDestroyed()) {
        mainWindow?.webContents.send('backend-error', 'Failed to start backend server.');
      }
    });

    backendProcess.on('exit', (code, signal) => {
      console.log(`Backend process exited with code ${code} and signal ${signal}`);
      backendProcess = null;
      if (!mainWindow?.isDestroyed()) {
        mainWindow?.webContents.send('backend-exit', 'Backend server stopped unexpectedly.');
      }
    });

    console.log(`Backend process started with PID: ${backendProcess.pid}`);
    return portToUse;

  } catch (error) {
    console.error('Error starting backend:', error);
    throw error;
  }
}

function stopBackend() {
  if (backendProcess) {
    console.log(`Stopping backend process with PID: ${backendProcess.pid}`);
    // For Windows, use SIGTERM, otherwise use SIGKILL
    const signal = process.platform === 'win32' ? 'SIGTERM' : 'SIGKILL';

    // Attempt a graceful shutdown first (e.g., sending a shutdown signal to the server)
    if (backendProcess && backendProcess.kill(signal)) {
        console.log(`Sent shutdown signal (${signal}) to backend process`);

        // Give the backend a short time to shut down gracefully
        setTimeout(() => {
            if (backendProcess && !backendProcess.killed) {
                console.log('Backend did not shut down gracefully, killing it.');
                backendProcess.kill(signal); // Force kill if it's still running
            }
        }, 2000); // 2 seconds timeout for graceful shutdown
    } else {
        console.log('No backend process to stop.');
    }
    backendProcess = null;
  }
}

async function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'), // Create preload.js for IPC
      },
    });

    if (isDev) {
        // For development, load from Vite dev server
      await mainWindow.loadURL('http://localhost:32101');
      mainWindow.webContents.openDevTools(); // Open dev tools for dev
    } else {
        // For production, load the built index.html
      await mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '../dist/index.html'),
        protocol: 'file:',
        slashes: true,
      }));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Ensure backend is stopped when the Electron app is quitting
app.on('before-quit', (event) => {
    console.log('Electron app is quitting, stopping backend...');
    event.preventDefault(); // Prevent the app from quitting immediately
    stopBackend();
    app.quit(); // Quit after backend is stopped
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
});

app.whenReady().then(async () => {
    try {
      const backendPort = await startBackend();
      console.log(`Backend started on port ${backendPort}`);

      createWindow();

      // Send backend port to renderer process (frontend)
      mainWindow?.webContents.on('dom-ready', () => {
        mainWindow?.webContents.send('backend-port', backendPort);
      });

    } catch (error) {
      console.error('Failed to start Electron app:', error);
      app.quit(); // Quit if backend fails to start
    }
});
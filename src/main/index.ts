import { join } from 'node:path'
import { BrowserWindow, app } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { AppController } from './app-controller'
import { registerIpcHandlers } from './ipc/ipc-handlers'

let controller: AppController | undefined
let ipcRegistered = false

function createWindow(appController: AppController): void {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    title: 'ApiReplay',
    backgroundColor: '#090b10',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  appController.attachWindow(window)
  if (!ipcRegistered) {
    registerIpcHandlers(appController)
    ipcRegistered = true
  }

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.apireplay.desktop')
  app.on('browser-window-created', (_event, window) => optimizer.watchWindowShortcuts(window))
  controller = await AppController.create()
  createWindow(controller)
})

app.on('window-all-closed', () => {
  void controller?.shutdown().finally(() => app.quit())
})

app.on('before-quit', () => {
  void controller?.shutdown()
})

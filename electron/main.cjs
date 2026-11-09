const { app, BrowserWindow, Menu, net, protocol, shell } = require('electron')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const APP_ORIGIN = 'app://journal'
const DIST_DIR = path.join(__dirname, '..', 'dist')
const INDEX_FILE = path.join(DIST_DIR, 'index.html')

// Register a secure, standard origin for the bundled UI. This gives IndexedDB
// and localStorage a stable origin (instead of a file:// URL) in production.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
])

let mainWindow = null

function resolveBundlePath(pathname) {
  const requested = pathname === '/' || pathname === '' ? '/index.html' : pathname
  const filePath = path.join(DIST_DIR, path.normalize(requested))
  const relative = path.relative(DIST_DIR, filePath)

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null
  }

  return filePath
}

function registerBundleProtocol() {
  protocol.handle('app', async (request) => {
    const { pathname } = new URL(request.url)
    const filePath = resolveBundlePath(decodeURIComponent(pathname))

    if (!filePath) {
      return new Response('Not found', { status: 404 })
    }

    try {
      return await net.fetch(pathToFileURL(filePath).toString())
    } catch {
      // SPA fallback: unknown paths are handled by the client-side router.
      return net.fetch(pathToFileURL(INDEX_FILE).toString())
    }
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0a0e15',
    title: 'TraderCasa Journal',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`${APP_ORIGIN}/`)) {
      event.preventDefault()
      if (url.startsWith('https://') || url.startsWith('http://')) {
        void shell.openExternal(url)
      }
    }
  })

  void mainWindow.loadURL(`${APP_ORIGIN}/index.html`)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.setAppUserModelId('com.traderscasa.journal')

app.whenReady().then(() => {
  registerBundleProtocol()
  Menu.setApplicationMenu(null)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

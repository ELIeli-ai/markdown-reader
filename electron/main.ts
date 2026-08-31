import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { TextDecoder } from 'node:util'
import type { AppCommand, DiscardDecision, FileResult, OpenedFile } from '../src/types/ipc'

const markdownExtensions = new Set(['.md', '.markdown', '.mdown', '.mkd'])
let mainWindow: BrowserWindow | null = null
let isDocumentModified = false
let mayCloseWindow = false

function isMarkdownPath(filePath: string): boolean {
  return markdownExtensions.has(path.extname(filePath).toLowerCase())
}

function ensureMarkdownExtension(filePath: string): string {
  return path.extname(filePath) ? filePath : `${filePath}.md`
}

function isPathWithin(childPath: string, parentPath: string): boolean {
  const relativePath = path.relative(parentPath, childPath)
  return relativePath !== '' && !relativePath.startsWith(`..${path.sep}`) && relativePath !== '..' && !path.isAbsolute(relativePath)
}

function resolveLocalImage(filePath: unknown, imagePath: unknown): string {
  if (typeof filePath !== 'string' || typeof imagePath !== 'string' || !isMarkdownPath(filePath)) return ''
  if (/^(https?:|data:)/i.test(imagePath)) return imagePath
  if (!imagePath || /^[a-z][a-z0-9+.-]*:/i.test(imagePath)) return ''

  const documentDirectory = path.dirname(filePath)
  const resolvedPath = path.resolve(documentDirectory, imagePath)
  if (!isPathWithin(resolvedPath, documentDirectory)) return ''

  return pathToFileURL(resolvedPath).toString()
}

function getDocumentDirectoryUrl(filePath: unknown): string {
  if (typeof filePath !== 'string' || !isMarkdownPath(filePath)) return ''
  return pathToFileURL(`${path.dirname(filePath)}${path.sep}`).toString()
}

function displayName(filePath: string): string {
  return path.basename(filePath)
}

function fileErrorMessage(error: unknown, operation: 'open' | 'save'): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  if (code === 'ENOENT') return '文件已经不存在。'
  if (code === 'EACCES' || code === 'EPERM') return operation === 'open' ? '无法读取该文件，请检查文件权限。' : '文件保存失败，请检查文件权限。'
  if (code === 'ENOSPC') return '磁盘空间不足，无法保存文件。'
  return operation === 'open' ? '无法打开该文件。' : '文件保存失败，请稍后重试。'
}

async function readMarkdownFile(filePath: string): Promise<FileResult> {
  if (!isMarkdownPath(filePath)) return { status: 'error', message: '请选择 Markdown 文件。' }

  try {
    const buffer = await fs.readFile(filePath)
    const content = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
    const file: OpenedFile = { content, filePath, fileName: displayName(filePath) }
    return { status: 'success', file }
  } catch (error) {
    return { status: 'error', message: fileErrorMessage(error, 'open') }
  }
}

async function writeMarkdownFile(content: string, filePath: string): Promise<FileResult> {
  if (!isMarkdownPath(filePath)) return { status: 'error', message: '文件必须使用 Markdown 扩展名。' }

  try {
    await fs.writeFile(filePath, content, 'utf8')
    const file: OpenedFile = { content, filePath, fileName: displayName(filePath) }
    return { status: 'success', file }
  } catch (error) {
    return { status: 'error', message: fileErrorMessage(error, 'save') }
  }
}

function sendCommand(command: AppCommand): void {
  mainWindow?.webContents.send('app:command', command)
}

function createMenu(): void {
  const menu = Menu.buildFromTemplate([
    {
      label: '文件',
      submenu: [
        { label: '新建', accelerator: 'CommandOrControl+N', click: () => sendCommand('new') },
        { label: '打开…', accelerator: 'CommandOrControl+O', click: () => sendCommand('open') },
        { type: 'separator' },
        { label: '保存', accelerator: 'CommandOrControl+S', click: () => sendCommand('save') },
        { label: '另存为…', accelerator: 'CommandOrControl+Shift+S', click: () => sendCommand('save-as') },
        { type: 'separator' },
        { role: 'close' }
      ]
    },
    {
      label: '编辑',
      submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }]
    }
  ])
  Menu.setApplicationMenu(menu)
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 860,
    minHeight: 600,
    title: 'Markdown Reader',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.on('close', (event) => {
    if (!isDocumentModified || mayCloseWindow) return
    event.preventDefault()
    mainWindow?.webContents.send('app:request-close')
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowedUrl = process.env.ELECTRON_RENDERER_URL
    if (allowedUrl && url.startsWith(allowedUrl)) return
    event.preventDefault()
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

ipcMain.handle('file:open', async (): Promise<FileResult> => {
  if (!mainWindow) return { status: 'error', message: '应用窗口不可用。' }
  const selection = await dialog.showOpenDialog(mainWindow, {
    title: '打开 Markdown 文件',
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: [...markdownExtensions].map((extension) => extension.slice(1)) }]
  })
  if (selection.canceled || selection.filePaths.length === 0) return { status: 'cancelled' }
  return readMarkdownFile(selection.filePaths[0])
})

ipcMain.handle('file:save', async (_event, payload: { content: string; filePath: string }): Promise<FileResult> => {
  return writeMarkdownFile(payload.content, payload.filePath)
})

ipcMain.handle('file:save-as', async (_event, payload: { content: string; suggestedName: string }): Promise<FileResult> => {
  if (!mainWindow) return { status: 'error', message: '应用窗口不可用。' }
  const selection = await dialog.showSaveDialog(mainWindow, {
    title: '另存为 Markdown 文件',
    defaultPath: ensureMarkdownExtension(payload.suggestedName || '未命名.md'),
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd'] }]
  })
  if (selection.canceled || !selection.filePath) return { status: 'cancelled' }
  return writeMarkdownFile(payload.content, ensureMarkdownExtension(selection.filePath))
})

ipcMain.handle('document:confirm-discard', async (_event, fileName: string): Promise<DiscardDecision> => {
  if (!mainWindow) return 'cancel'
  const response = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    title: '未保存的修改',
    message: `“${fileName}”有未保存的修改。`,
    detail: '是否先保存？',
    buttons: ['保存', '不保存', '取消'],
    defaultId: 0,
    cancelId: 2,
    noLink: true
  })
  return ['save', 'discard', 'cancel'][response.response] as DiscardDecision
})

ipcMain.handle('document:set-modified', (_event, isModified: boolean) => {
  isDocumentModified = isModified
})

ipcMain.on('image:resolve', (event, payload: { filePath?: unknown; imagePath?: unknown }) => {
  event.returnValue = resolveLocalImage(payload?.filePath, payload?.imagePath)
})

ipcMain.on('image:document-directory', (event, filePath: unknown) => {
  event.returnValue = getDocumentDirectoryUrl(filePath)
})

ipcMain.handle('app:confirm-close', () => {
  mayCloseWindow = true
  mainWindow?.close()
})

app.whenReady().then(() => {
  createMenu()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

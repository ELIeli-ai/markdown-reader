import { contextBridge, ipcRenderer } from 'electron'
import type { AppCommand, MarkdownDesktopApi } from '../src/types/ipc'

function subscribe<T>(channel: string, listener: (payload: T) => void): () => void {
  const wrappedListener = (_event: Electron.IpcRendererEvent, payload: T) => listener(payload)
  ipcRenderer.on(channel, wrappedListener)
  return () => ipcRenderer.removeListener(channel, wrappedListener)
}

const api: MarkdownDesktopApi = {
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (content, filePath) => ipcRenderer.invoke('file:save', { content, filePath }),
  saveFileAs: (content, suggestedName) => ipcRenderer.invoke('file:save-as', { content, suggestedName }),
  confirmDiscard: (fileName) => ipcRenderer.invoke('document:confirm-discard', fileName),
  confirmClose: () => ipcRenderer.invoke('app:confirm-close'),
  setModified: (isModified) => ipcRenderer.invoke('document:set-modified', isModified),
  resolveLocalImage: (filePath, imagePath) => ipcRenderer.sendSync('image:resolve', { filePath, imagePath }),
  getDocumentDirectoryUrl: (filePath) => ipcRenderer.sendSync('image:document-directory', filePath),
  onCommand: (listener) => subscribe<AppCommand>('app:command', listener),
  onCloseRequest: (listener) => subscribe('app:request-close', listener)
}

contextBridge.exposeInMainWorld('markdownApi', api)

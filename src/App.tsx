import { useCallback, useEffect, useState } from 'react'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'
import { StatusBar } from './components/StatusBar'
import { Toolbar } from './components/Toolbar'
import type { ViewMode } from './components/Toolbar'
import type { AppCommand, FileResult } from './types/ipc'

const initialFileName = '未命名.md'

export default function App() {
  const [content, setContent] = useState('')
  const [filePath, setFilePath] = useState('')
  const [fileName, setFileName] = useState(initialFileName)
  const [isModified, setIsModified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [statusText, setStatusText] = useState('准备就绪')
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [zoomPercent, setZoomPercent] = useState(100)

  useEffect(() => {
    void window.markdownApi.setModified(isModified)
  }, [isModified])

  const applyFileResult = useCallback((result: FileResult, successMessage: string): boolean => {
    if (result.status === 'success') {
      setContent(result.file.content)
      setFilePath(result.file.filePath)
      setFileName(result.file.fileName)
      setIsModified(false)
      setStatusText(successMessage)
      return true
    }
    if (result.status === 'error') setStatusText(result.message)
    return false
  }, [])

  const saveDocument = useCallback(async (saveAs: boolean): Promise<boolean> => {
    setIsLoading(true)
    try {
      const result = saveAs || !filePath
        ? await window.markdownApi.saveFileAs(content, fileName)
        : await window.markdownApi.saveFile(content, filePath)
      return applyFileResult(result, '已保存')
    } finally {
      setIsLoading(false)
    }
  }, [applyFileResult, content, fileName, filePath])

  const confirmDocumentChange = useCallback(async (): Promise<boolean> => {
    if (!isModified) return true
    const decision = await window.markdownApi.confirmDiscard(fileName)
    if (decision === 'save') return saveDocument(false)
    return decision === 'discard'
  }, [fileName, isModified, saveDocument])

  const newDocument = useCallback(async () => {
    if (!await confirmDocumentChange()) return
    setContent('')
    setFilePath('')
    setFileName(initialFileName)
    setIsModified(false)
    setStatusText('已新建空白文档')
  }, [confirmDocumentChange])

  const openDocument = useCallback(async () => {
    if (!await confirmDocumentChange()) return
    setIsLoading(true)
    try {
      const result = await window.markdownApi.openFile()
      applyFileResult(result, '已打开文件')
    } finally {
      setIsLoading(false)
    }
  }, [applyFileResult, confirmDocumentChange])

  const closeDocument = useCallback(async () => {
    if (await confirmDocumentChange()) await window.markdownApi.confirmClose()
  }, [confirmDocumentChange])

  const handleCommand = useCallback((command: AppCommand) => {
    if (command === 'new') void newDocument()
    if (command === 'open') void openDocument()
    if (command === 'save') void saveDocument(false)
    if (command === 'save-as') void saveDocument(true)
  }, [newDocument, openDocument, saveDocument])

  useEffect(() => window.markdownApi.onCommand(handleCommand), [handleCommand])
  useEffect(() => window.markdownApi.onCloseRequest(() => void closeDocument()), [closeDocument])

  const changeZoom = (step: number) => {
    setZoomPercent((currentZoom) => Math.min(160, Math.max(70, currentZoom + step)))
  }

  return (
    <main className="app-shell">
      <Toolbar
        fileName={fileName}
        isLoading={isLoading}
        viewMode={viewMode}
        zoomPercent={zoomPercent}
        onNew={() => void newDocument()}
        onOpen={() => void openDocument()}
        onSave={() => void saveDocument(false)}
        onSaveAs={() => void saveDocument(true)}
        onViewModeChange={setViewMode}
        onZoomIn={() => changeZoom(10)}
        onZoomOut={() => changeZoom(-10)}
        onZoomReset={() => setZoomPercent(100)}
      />
      <div className={`workspace view-${viewMode} zoom-${zoomPercent}`}>
        <Editor content={content} isLoading={isLoading} onChange={(nextContent) => {
          setContent(nextContent)
          setIsModified(true)
          setStatusText('正在编辑')
        }} />
        <Preview content={content} filePath={filePath} />
      </div>
      <StatusBar characterCount={content.length} filePath={filePath} isModified={isModified} statusText={statusText} />
    </main>
  )
}

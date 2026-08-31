import { useEffect, useRef, useState } from 'react'

export type ViewMode = 'editor' | 'split' | 'preview'

type ToolbarProps = {
  fileName: string
  isLoading: boolean
  viewMode: ViewMode
  zoomPercent: number
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onSaveAs: () => void
  onViewModeChange: (viewMode: ViewMode) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
}

const viewOptions: Array<{ label: string; value: ViewMode }> = [
  { label: '编辑', value: 'editor' },
  { label: '双栏', value: 'split' },
  { label: '预览', value: 'preview' }
]

export function Toolbar({
  fileName,
  isLoading,
  viewMode,
  zoomPercent,
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onViewModeChange,
  onZoomIn,
  onZoomOut,
  onZoomReset
}: ToolbarProps) {
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false)
  const fileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isFileMenuOpen) return

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!fileMenuRef.current?.contains(event.target as Node)) setIsFileMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFileMenuOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePress)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isFileMenuOpen])

  const runFileAction = (action: () => void) => {
    setIsFileMenuOpen(false)
    action()
  }

  return (
    <header className="toolbar">
      <div className="app-name">Markdown Reader</div>
      <div className="file-menu" ref={fileMenuRef}>
        <button
          type="button"
          className="file-menu-trigger"
          aria-expanded={isFileMenuOpen}
          aria-controls="file-actions"
          onClick={() => setIsFileMenuOpen((isOpen) => !isOpen)}
          disabled={isLoading}
        >
          文件 <span aria-hidden="true">⌄</span>
        </button>
        {isFileMenuOpen && (
          <nav id="file-actions" aria-label="文档操作" className="file-menu-popover">
            <button type="button" onClick={() => runFileAction(onNew)}>新建</button>
            <button type="button" onClick={() => runFileAction(onOpen)}>打开</button>
            <button type="button" onClick={() => runFileAction(onSave)}>保存</button>
            <button type="button" onClick={() => runFileAction(onSaveAs)}>另存为</button>
          </nav>
        )}
      </div>
      <div className="view-controls" role="group" aria-label="阅读视图">
        {viewOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={viewMode === option.value}
            onClick={() => onViewModeChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="zoom-controls" role="group" aria-label="内容缩放">
        <button type="button" aria-label="缩小内容" onClick={onZoomOut} disabled={zoomPercent <= 70}>−</button>
        <button type="button" className="zoom-value" title="恢复 100%" onClick={onZoomReset}>{zoomPercent}%</button>
        <button type="button" aria-label="放大内容" onClick={onZoomIn} disabled={zoomPercent >= 160}>＋</button>
      </div>
      <div className="current-file" title={fileName}>{fileName}</div>
    </header>
  )
}

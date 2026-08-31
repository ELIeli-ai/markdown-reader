type StatusBarProps = {
  characterCount: number
  filePath: string
  isModified: boolean
  statusText: string
}

export function StatusBar({ characterCount, filePath, isModified, statusText }: StatusBarProps) {
  return (
    <footer className="status-bar">
      <span>{isModified ? '未保存' : '已保存'}</span>
      <span>{characterCount} 个字符</span>
      <span className="status-message" role="status">{statusText}</span>
      <span className="path" title={filePath}>{filePath || '尚未保存到本地'}</span>
    </footer>
  )
}

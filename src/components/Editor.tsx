type EditorProps = {
  content: string
  isLoading: boolean
  onChange: (content: string) => void
}

export function Editor({ content, isLoading, onChange }: EditorProps) {
  return (
    <section className="editor-pane" aria-label="Markdown 编辑区">
      <label className="visually-hidden" htmlFor="markdown-editor">Markdown 内容</label>
      <textarea
        id="markdown-editor"
        value={content}
        disabled={isLoading}
        onChange={(event) => onChange(event.target.value)}
        placeholder="# 开始写作\n\n在这里输入 Markdown…"
        spellCheck="false"
      />
    </section>
  )
}

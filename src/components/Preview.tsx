import { useMemo } from 'react'
import { renderMarkdown } from '../services/markdown'

type PreviewProps = {
  content: string
  filePath: string
}

export function Preview({ content, filePath }: PreviewProps) {
  const html = useMemo(() => renderMarkdown(content, filePath), [content, filePath])

  return (
    <section className="preview-pane" aria-label="Markdown 预览区">
      <article className="markdown-content" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  )
}

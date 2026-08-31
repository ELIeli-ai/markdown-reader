import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('renders common Markdown and highlighted code', () => {
    const html = renderMarkdown('# 标题\n\n**粗体**\n\n```ts\nconst value = 1\n```', '')
    expect(html).toContain('<h1>标题</h1>')
    expect(html).toContain('<strong>粗体</strong>')
    expect(html).toContain('hljs')
  })

  it('removes executable HTML and inline event handlers', () => {
    const html = renderMarkdown('<script>alert(1)</script><img src="x" onerror="alert(1)">', '')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('onerror')
  })

  it('does not allow raw file URLs without a document directory', () => {
    const html = renderMarkdown('<img src="file:///private/secret.png">', '')
    expect(html).not.toContain('file:///private/secret.png')
  })
})

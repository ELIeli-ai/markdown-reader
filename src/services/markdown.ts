import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import { marked } from 'marked'

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlightedCode(text: string, language: string | undefined): string {
  const normalizedLanguage = language?.trim().toLowerCase() || 'plaintext'
  const highlighted = hljs.getLanguage(normalizedLanguage)
    ? hljs.highlight(text, { language: normalizedLanguage }).value
    : hljs.highlightAuto(text).value

  return `<pre><code class="hljs language-${escapeAttribute(normalizedLanguage)}">${highlighted}</code></pre>`
}

export function renderMarkdown(content: string, filePath: string): string {
  const renderer = new marked.Renderer()
  renderer.code = ({ text, lang }) => highlightedCode(text, lang)
  renderer.image = ({ href, title, text }) => {
    const source = filePath ? window.markdownApi.resolveLocalImage(filePath, href) : href
    if (!source) return `<span class="missing-image">图片路径不可用：${escapeAttribute(text)}</span>`

    const titleAttribute = title ? ` title="${escapeAttribute(title)}"` : ''
    return `<img src="${escapeAttribute(source)}" alt="${escapeAttribute(text)}" loading="lazy"${titleAttribute} />`
  }
  renderer.link = ({ href, title, text }) => {
    const titleAttribute = title ? ` title="${escapeAttribute(title)}"` : ''
    return `<a href="${escapeAttribute(href)}" target="_blank" rel="noreferrer noopener"${titleAttribute}>${text}</a>`
  }

  const localDirectoryUrl = filePath ? window.markdownApi.getDocumentDirectoryUrl(filePath) : ''
  const permitLocalImages = (node: Element, data: { attrName: string; attrValue: string; forceKeepAttr?: boolean; keepAttr?: boolean }) => {
    if (data.attrName !== 'src' || !data.attrValue.startsWith('file:')) return
    const isDocumentImage = node.nodeName === 'IMG' && localDirectoryUrl && data.attrValue.startsWith(localDirectoryUrl)
    if (isDocumentImage) data.forceKeepAttr = true
    else data.keepAttr = false
  }

  DOMPurify.addHook('uponSanitizeAttribute', permitLocalImages)
  try {
    const rendered = marked.parse(content, { async: false, gfm: true, breaks: false, renderer })
    return DOMPurify.sanitize(rendered, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target', 'rel', 'loading'],
      FORBID_ATTR: ['style']
    })
  } finally {
    DOMPurify.removeHook('uponSanitizeAttribute')
  }
}

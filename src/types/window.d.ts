import type { MarkdownDesktopApi } from './ipc'

declare global {
  interface Window {
    markdownApi: MarkdownDesktopApi
  }
}

export {}

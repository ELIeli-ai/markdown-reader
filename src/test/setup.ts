import '@testing-library/jest-dom/vitest'

Object.defineProperty(window, 'markdownApi', {
  value: {
    resolveLocalImage: (_filePath: string, imagePath: string) => imagePath,
    getDocumentDirectoryUrl: () => ''
  },
  writable: true
})

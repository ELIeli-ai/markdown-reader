export type AppCommand = 'new' | 'open' | 'save' | 'save-as'

export type OpenedFile = {
  content: string
  fileName: string
  filePath: string
}

export type FileResult =
  | { status: 'success'; file: OpenedFile }
  | { status: 'cancelled' }
  | { status: 'error'; message: string }

export type DiscardDecision = 'save' | 'discard' | 'cancel'

export type MarkdownDesktopApi = {
  openFile: () => Promise<FileResult>
  saveFile: (content: string, filePath: string) => Promise<FileResult>
  saveFileAs: (content: string, suggestedName: string) => Promise<FileResult>
  confirmDiscard: (fileName: string) => Promise<DiscardDecision>
  confirmClose: () => Promise<void>
  setModified: (isModified: boolean) => Promise<void>
  resolveLocalImage: (filePath: string, imagePath: string) => string
  getDocumentDirectoryUrl: (filePath: string) => string
  onCommand: (listener: (command: AppCommand) => void) => () => void
  onCloseRequest: (listener: () => void) => () => void
}

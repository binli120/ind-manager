// Author: Bin Lee (blee@filynai.com)
// Description: Centralised file-related constants for upload and import flows.

export const MIME_TYPES = {
  pdf: 'application/pdf',
  plainText: 'text/plain',
  markdown: 'text/markdown',
  msWord: 'application/msword',
  wordProcessingMl:
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  html: 'text/html',
} as const

export const FILE_EXTENSIONS = {
  pdf: '.pdf',
  plainText: '.txt',
  markdown: '.md',
  msWord: '.doc',
  wordProcessingMl: '.docx',
  html: '.html',
} as const

export const UPLOAD_ACCEPTED_FILE_TYPES = {
  [MIME_TYPES.pdf]: [FILE_EXTENSIONS.pdf],
  [MIME_TYPES.plainText]: [FILE_EXTENSIONS.plainText],
  [MIME_TYPES.markdown]: [FILE_EXTENSIONS.markdown],
  [MIME_TYPES.msWord]: [FILE_EXTENSIONS.msWord],
  [MIME_TYPES.wordProcessingMl]: [FILE_EXTENSIONS.wordProcessingMl],
  [MIME_TYPES.html]: [FILE_EXTENSIONS.html],
} satisfies Record<string, string[]>

export const UPLOAD_SUPPORTED_EXTENSIONS = [
  FILE_EXTENSIONS.pdf,
  FILE_EXTENSIONS.plainText,
  FILE_EXTENSIONS.markdown,
  FILE_EXTENSIONS.msWord,
  FILE_EXTENSIONS.wordProcessingMl,
  FILE_EXTENSIONS.html,
] as const

export const UPLOAD_ACCEPT_ATTRIBUTE = UPLOAD_SUPPORTED_EXTENSIONS.join(',')

export const UPLOAD_SUPPORTED_LABEL = UPLOAD_SUPPORTED_EXTENSIONS.map((ext) =>
  ext.slice(1).toUpperCase()
).join(', ')

export const WORD_IMPORT_ACCEPTED_FILE_TYPES = {
  [MIME_TYPES.pdf]: [FILE_EXTENSIONS.pdf],
  [MIME_TYPES.msWord]: [FILE_EXTENSIONS.msWord],
  [MIME_TYPES.wordProcessingMl]: [FILE_EXTENSIONS.wordProcessingMl],
} satisfies Record<string, string[]>

export const FILE_UPLOAD_STATUS = {
  uploading: 'uploading',
  processing: 'processing',
  completed: 'completed',
  error: 'error',
} as const

export type FileUploadStatus =
  (typeof FILE_UPLOAD_STATUS)[keyof typeof FILE_UPLOAD_STATUS]

export const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024
export const DEFAULT_LARGE_FILE_WARNING_BYTES = 8 * 1024 * 1024

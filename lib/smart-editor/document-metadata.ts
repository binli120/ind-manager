export interface StoredDocumentMetadata {
  id: string;
  sectionId: string;
  sectionName: string;
  title: string;
  type: string;
  tags: string[];
  content?: string | null;
  textContent?: string | null;
  indClassification?: unknown;
  originalPath?: string | null;
  warning?: string | null;
  sources?: number;
  starred?: boolean;
  uploadedAt?: string;
  size?: number;
  fileKey: string;
  originalFileName: string;
  extra?: Record<string, unknown>;
  hasMarkdown?: boolean;
}

export interface StoredDocumentWithUrl extends StoredDocumentMetadata {
  fileUrl?: string | null;
}

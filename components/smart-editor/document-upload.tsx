'use client';

// Author: Bin Lee (blee@filynai.com)
// Description: Handles drag-and-drop document uploads, processing, and content preparation for the editor.

import {
  convertPDFTextToHTML,
  parsePdfDate,
  type PDFExtractionResult,
} from '@/lib/smart-editor/pdf-utils';
import { classifyIndDocument } from '@/lib/smart-editor/ind-classifier';
import type { IndClassification } from '@/lib/smart-editor/ind-classifier';
import {
  DEFAULT_LARGE_FILE_WARNING_BYTES,
  FILE_EXTENSIONS,
  FILE_UPLOAD_STATUS,
  type FileUploadStatus,
  MAX_UPLOAD_FILE_SIZE_BYTES,
  MIME_TYPES,
  UPLOAD_ACCEPTED_FILE_TYPES,
  UPLOAD_SUPPORTED_LABEL,
} from '@/lib/smart-editor/file-constants';
import { fileToDataUrl, formatBytes } from '@/lib/smart-editor/utils';
import { AlertCircle, File, FileText, Upload, X, CheckCircle } from 'lucide-react';
import mammoth from 'mammoth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { convertPlainTextToHtml } from '@/lib/smart-editor/text-utils';
import { createPdfEmbedHtml } from '@/lib/smart-editor/tiptap-pdf-embed';

export interface ProcessedUploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: FileUploadStatus;
  progress: number;
  error?: string;
  warning?: string;
  content?: string;
  textContent?: string;
  pages?: number;
  metadata?: Record<string, unknown>;
  pdfDataUrl?: string;
  indClassification?: IndClassification;
  originalPath?: string;
  originalFile?: File;
}

interface InternalUploadedFile extends ProcessedUploadedFile {
  originalFile?: File;
}

interface DocumentUploadProps {
  onUploadComplete?: (files: ProcessedUploadedFile[]) => void;
}

interface PdfExtractResponse {
  success: boolean;
  text?: string;
  html?: string;
  pages?: number;
  filename: string;
  size: number;
  warning?: string;
  info?: {
    Title?: string;
    Author?: string;
    Subject?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
  };
  error?: string;
  dataUrl?: string;
}

const stripHtmlTags = (html: string): string =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const MAX_FILE_SIZE_LABEL = formatBytes(MAX_UPLOAD_FILE_SIZE_BYTES);

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<InternalUploadedFile[]>([]);
  const reportedCompletedRef = useRef<Set<string>>(new Set());

  const updateFile = useCallback(
    (fileId: string, updates: Partial<InternalUploadedFile>) => {
      setUploadedFiles((prev) =>
        prev.map((file) =>
          file.id === fileId ? { ...file, ...updates } : file
        )
      );
    },
    []
  );

  const processPdf = useCallback(
    async (file: File, fileId: string) => {
      updateFile(fileId, {
        status: FILE_UPLOAD_STATUS.processing,
        progress: 40,
      });

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/smart-editor/pdf-extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let message = errorText?.trim();
        if (message) {
          try {
            const parsed = JSON.parse(message);
            message = parsed?.error || parsed?.message || message;
          } catch {
            // leave message as raw text
          }
        }
        throw new Error(
          message || `Failed to extract PDF (${response.status})`
        );
      }

      const result = (await response.json()) as PdfExtractResponse;

      if (!result.success) {
        throw new Error(result.error || 'PDF extraction failed');
      }

      const pdfDataUrl = result.dataUrl || (await fileToDataUrl(file));

      const pdfResult: PDFExtractionResult = {
        text: result.text || '',
        pages: result.pages || 0,
        metadata: {
          title: result.info?.Title || file.name.replace(/\.pdf$/i, ''),
          author: result.info?.Author,
          subject: result.info?.Subject,
          creator: result.info?.Creator,
          producer: result.info?.Producer,
          creationDate: parsePdfDate(result.info?.CreationDate),
          modificationDate: parsePdfDate(result.info?.ModDate),
        },
      };

      const classification = classifyIndDocument({
        title: pdfResult.metadata.title,
        subject: result.info?.Subject,
        text: pdfResult.text,
      });

      const markupContent =
        result.html?.trim().length
          ? result.html
          : convertPDFTextToHTML(pdfResult);
      const pdfEmbedHtml = pdfDataUrl
        ? createPdfEmbedHtml({
            src: pdfDataUrl,
            title: file.name,
            height: 720,
          })
        : '';

      const combinedContent = [pdfEmbedHtml, markupContent]
        .filter(Boolean)
        .join('\n');

      updateFile(fileId, {
        status: FILE_UPLOAD_STATUS.completed,
        progress: 100,
        content: combinedContent,
        textContent: pdfResult.text,
        pages: pdfResult.pages,
        metadata: {
          ...pdfResult.metadata,
          indClassification: classification,
        },
        pdfDataUrl,
        indClassification: classification,
        warning: result.warning,
      });
    },
    [updateFile]
  );

  const processPlainText = useCallback(
    async (file: File, fileId: string) => {
      updateFile(fileId, {
        status: FILE_UPLOAD_STATUS.processing,
        progress: 40,
      });
      const text = await file.text();
      const htmlContent = convertPlainTextToHtml(text);

      updateFile(fileId, {
        status: FILE_UPLOAD_STATUS.completed,
        progress: 100,
        content: htmlContent,
        textContent: text,
      });
    },
    [updateFile]
  );

  const processHtml = useCallback(
    async (file: File, fileId: string) => {
      updateFile(fileId, {
        status: FILE_UPLOAD_STATUS.processing,
        progress: 40,
      });
      const html = await file.text();

      updateFile(fileId, {
        status: FILE_UPLOAD_STATUS.completed,
        progress: 100,
        content: html,
        textContent: stripHtmlTags(html),
      });
    },
    [updateFile]
  );

  const processDocx = useCallback(
    async (file: File, fileId: string) => {
      updateFile(fileId, {
        status: FILE_UPLOAD_STATUS.processing,
        progress: 40,
      });
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });

      updateFile(fileId, {
        status: FILE_UPLOAD_STATUS.completed,
        progress: 100,
        content: result.value,
        textContent: stripHtmlTags(result.value),
      });
    },
    [updateFile]
  );

  const processFile = useCallback(
    async (file: InternalUploadedFile) => {
      const original = file.originalFile;
      if (!original) {
        updateFile(file.id, {
          status: FILE_UPLOAD_STATUS.error,
          error: 'Original file data not available',
          progress: 0,
        });
        return;
      }

      try {
        if (
          original.type === MIME_TYPES.pdf ||
          original.name.toLowerCase().endsWith(FILE_EXTENSIONS.pdf)
        ) {
          await processPdf(original, file.id);
        } else if (
          original.type === MIME_TYPES.html ||
          original.name.toLowerCase().endsWith(FILE_EXTENSIONS.html)
        ) {
          await processHtml(original, file.id);
        } else if (
          original.type.startsWith('text/') ||
          original.name.toLowerCase().endsWith(FILE_EXTENSIONS.markdown) ||
          original.name.toLowerCase().endsWith(FILE_EXTENSIONS.plainText)
        ) {
          await processPlainText(original, file.id);
        } else if (
          original.type === MIME_TYPES.wordProcessingMl ||
          original.name.toLowerCase().endsWith(FILE_EXTENSIONS.wordProcessingMl)
        ) {
          await processDocx(original, file.id);
        } else if (original.type === MIME_TYPES.msWord) {
          throw new Error(
            'Legacy .doc files are not supported. Please convert the file to .docx format.'
          );
        } else {
          throw new Error('Unsupported file type.');
        }
      } catch (error) {
        let friendlyMessage =
          error instanceof Error ? error.message : 'Failed to process file';

        const lowerMessage =
          error instanceof Error ? error.message.toLowerCase() : '';

        if (
          error instanceof TypeError &&
          lowerMessage.includes('failed to fetch')
        ) {
          const hints: string[] = [];
          if (typeof window !== 'undefined' && !window.navigator.onLine) {
            hints.push('Your browser appears to be offline.');
          }
          hints.push(
            'The PDF extraction service is unreachable. Ensure the Next.js server is running and check the server console for API errors.'
          );
          if (file.size > DEFAULT_LARGE_FILE_WARNING_BYTES) {
            hints.push(
              `The PDF is ${formatBytes(
                file.size
              )}, which may exceed the server upload limit.`
            );
          }
          friendlyMessage = `${hints.join(' ')} (Failed to fetch)`;
        }

        if (
          friendlyMessage.toLowerCase().includes('unexpected token') ||
          friendlyMessage.toLowerCase().includes('invalid pdf structure')
        ) {
          friendlyMessage +=
            ' This PDF may be corrupted or encrypted. Try opening it locally to confirm it can be parsed.';
        }

        if (friendlyMessage.toLowerCase().includes('object.defineproperty')) {
          friendlyMessage +=
            ' PDF.js encountered an internal error while reading the file. This usually happens with malformed or scanned PDFs. Try saving a fresh copy of the document or converting it to a PDF/A format before uploading again.';
        }

        updateFile(file.id, {
          status: FILE_UPLOAD_STATUS.error,
          progress: 0,
          error: friendlyMessage,
        });
      }
    },
    [
      processDocx,
      processHtml,
      processPdf,
      processPlainText,
      updateFile,
    ]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const resolveFilePath = (file: File): string | undefined => {
        const anyFile = file as File & { path?: string };
        let rawPath =
          (file.webkitRelativePath && file.webkitRelativePath.trim()) ||
          (anyFile.path && anyFile.path.trim()) ||
          '';

        if (!rawPath) {
          return undefined;
        }

        // Normalise slashes and remove placeholder prefixes
        rawPath = rawPath.replace(/\\/g, '/');
        rawPath = rawPath.replace(/^\.\/+/, '');
        rawPath = rawPath.replace(/^c:\\fakepath\//i, '');

        if (!rawPath || rawPath === file.name) {
          return undefined;
        }

        return rawPath;
      };

      const newFiles: InternalUploadedFile[] = acceptedFiles.map((file) => ({
        id: `upload-${Math.random().toString(36).slice(2, 11)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: FILE_UPLOAD_STATUS.uploading,
        progress: 20,
        originalFile: file,
        indClassification: undefined,
        originalPath: resolveFilePath(file),
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      newFiles.forEach((file) => {
        // Kick off processing asynchronously
        void processFile(file);
      });
    },
    [processFile]
  );

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
    reportedCompletedRef.current.delete(fileId);
  };

  useEffect(() => {
    if (!onUploadComplete) {
      return;
    }

    const completedFiles = uploadedFiles.filter(
      (file) => file.status === FILE_UPLOAD_STATUS.completed
    );

    const newlyCompleted = completedFiles.filter(
      (file) => !reportedCompletedRef.current.has(file.id)
    );

    if (newlyCompleted.length === 0) {
      return;
    }

    const sanitizedFiles: ProcessedUploadedFile[] = newlyCompleted.map(
      (file) => ({
        ...file,
      })
    );

    onUploadComplete(sanitizedFiles);

    newlyCompleted.forEach((file) =>
      reportedCompletedRef.current.add(file.id)
    );
  }, [onUploadComplete, uploadedFiles]);

  const formatFileSize = formatBytes;

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return FileText;
    if (type.includes('text')) return FileText;
    return File;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: UPLOAD_ACCEPTED_FILE_TYPES,
    multiple: true,
  });

  return (
    <div className='space-y-4'>
      {/* Upload Area */}
      <Card>
        <CardContent className='p-6'>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
            <h3 className='text-lg font-medium text-foreground mb-2'>
              {isDragActive ? 'Drop files here' : 'Upload Documents'}
            </h3>
            <p className='text-muted-foreground mb-4'>
              Drag and drop files here, or click to select files
            </p>
            <p className='text-sm text-muted-foreground'>
              Supports {UPLOAD_SUPPORTED_LABEL} files up to {MAX_FILE_SIZE_LABEL}{' '}
              each
            </p>
            <Button className='mt-4'>
              <Upload className='h-4 w-4 mr-2' />
              Choose Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className='p-4'>
            <h3 className='font-medium text-foreground mb-4'>Uploaded Files</h3>
            <div className='space-y-3 max-h-64 overflow-y-auto pr-1'>
              {uploadedFiles.map((file) => {
                const FileIcon = getFileIcon(file.type);
                return (
                  <div
                    key={file.id}
                    className='flex items-center gap-3 p-3 border rounded-lg'
                  >
                    <FileIcon className='h-8 w-8 text-primary flex-shrink-0' />

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <p
                          className='font-medium text-sm text-foreground truncate'
                          title={file.originalPath ?? file.name}
                        >
                          {file.originalPath ?? file.name}
                        </p>
                        {!file.originalPath && (
                          <p className='text-[11px] text-muted-foreground'>
                            Full file path not provided by the browser for privacy.
                          </p>
                        )}
                        <Badge
                          variant={
                            file.status === FILE_UPLOAD_STATUS.completed
                              ? 'default'
                              : file.status === FILE_UPLOAD_STATUS.error
                              ? 'destructive'
                              : 'secondary'
                          }
                          className='text-xs'
                        >
                          {file.status}
                        </Badge>
                      </div>

                      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                        <span>{formatFileSize(file.size)}</span>
                        {file.status !== FILE_UPLOAD_STATUS.completed &&
                          file.status !== FILE_UPLOAD_STATUS.error && (
                            <>
                              <span>•</span>
                              <span>{file.progress}%</span>
                            </>
                          )}
                      </div>

                      {(file.status === FILE_UPLOAD_STATUS.uploading ||
                        file.status === FILE_UPLOAD_STATUS.processing) && (
                        <Progress value={file.progress} className='mt-2 h-1' />
                      )}

                      {file.error && (
                        <p className='text-xs text-destructive mt-1 whitespace-pre-wrap'>
                          {file.error}
                        </p>
                      )}
                    </div>

                    <div className='flex items-center gap-2'>
                      {file.status === FILE_UPLOAD_STATUS.completed && (
                        <CheckCircle className='h-5 w-5 text-green-500' />
                      )}
                      {file.status === FILE_UPLOAD_STATUS.error && (
                        <div className='flex flex-col items-center text-destructive text-[11px] max-w-[8rem] text-center'>
                          <AlertCircle className='h-5 w-5 text-destructive' />
                          {file.error && (
                            <span className='mt-1 leading-tight whitespace-pre-wrap'>
                              {file.error}
                            </span>
                          )}
                        </div>
                      )}
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => removeFile(file.id)}
                        className='h-8 w-8 p-0'
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

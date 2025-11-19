'use client';

// Author: Bin Lee (blee@filynai.com)
// Description: Manages the Word and PDF import workflow, showing progress, previews, and AI integrations.

import {
  AlertCircle,
  CheckCircle,
  FileIcon,
  FileText,
  Plus,
  Upload,
  X,
} from 'lucide-react';
import mammoth from 'mammoth';
import React, { useCallback, useState } from 'react';
import type { ProcessedUploadedFile } from './document-upload';
import { useDropzone } from 'react-dropzone';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { createLogger } from '@/lib/smart-editor/logger';
import {
  FILE_EXTENSIONS,
  FILE_UPLOAD_STATUS,
  MIME_TYPES,
  WORD_IMPORT_ACCEPTED_FILE_TYPES,
} from '@/lib/smart-editor/file-constants';
import { formatBytes } from '@/lib/smart-editor/utils';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

interface WordImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: Array<{ id: string; name: string }>;
  onImportComplete?: (
    files: ProcessedUploadedFile[],
    sectionId: string,
    tags: string[]
  ) => void;
  preselectedSection?: string | null;
  onTiptapImport?: (file: File, content: string) => Promise<void>;
}

interface ImportedFile extends ProcessedUploadedFile {
  originalFile?: File;
}

export function WordImportDialog({
  open,
  onOpenChange,
  sections,
  onImportComplete,
  preselectedSection,
  onTiptapImport,
}: WordImportDialogProps) {
  const logger = createLogger('WordImportDialog');
  const [selectedSection, setSelectedSection] = useState<string>(
    preselectedSection || ''
  );
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processWordFile = useCallback(
    (file: ImportedFile, delay: number) => {
      logger.debug(`Processing file ${file.name} starting in ${delay}ms...`);
      setTimeout(async () => {
        try {
          logger.debug(`Actually processing file ${file.name} now`);
          // Update status to processing
          setImportedFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? {
                    ...f,
                    status: FILE_UPLOAD_STATUS.processing,
                    progress: 30,
                  }
                : f
            )
          );

          const originalFile = file.originalFile;
          if (!originalFile) {
            logger.error('No original file found for', file.name);
            throw new Error('Original file not found');
          }

          let content = '';

          const fileNameLower = file.name.toLowerCase();
          const isPdf =
            file.type === MIME_TYPES.pdf ||
            fileNameLower.endsWith(FILE_EXTENSIONS.pdf);
          const isDocx =
            file.type === MIME_TYPES.wordProcessingMl ||
            fileNameLower.endsWith(FILE_EXTENSIONS.wordProcessingMl);
          const isDoc =
            file.type === MIME_TYPES.msWord ||
            fileNameLower.endsWith(FILE_EXTENSIONS.msWord);

          // Handle PDF files
          if (isPdf) {
            logger.debug('Processing PDF file:', file.name, 'Type:', file.type);

            // Update progress
            setImportedFiles((prev) =>
              prev.map((f) => (f.id === file.id ? { ...f, progress: 50 } : f))
            );

            // Use server-side PDF extraction API
            const formData = new FormData();
            formData.append('file', originalFile);

            const response = await fetch('/api/smart-editor/pdf-extract', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error(`Server error: ${response.statusText}`);
            }

            const result = await response.json();

            if (!result.success) {
              throw new Error(result.error || 'Failed to extract PDF text');
            }

            logger.debug('[PDF-API] Successfully extracted text:', {
              filename: result.filename,
              pages: result.pages,
              textLength: result.text?.length || 0,
            });

            // Update progress
            setImportedFiles((prev) =>
              prev.map((f) => (f.id === file.id ? { ...f, progress: 80 } : f))
            );

            // Format the extracted text as HTML content
            const extractedText = result.text || '';
            const safeFilename = escapeHtml(result.filename || file.name);
            const markupContent =
              typeof result.html === 'string' && result.html.trim().length > 0
                ? result.html
                : `<div style="white-space: pre-wrap; font-family: serif; line-height: 1.6;">${escapeHtml(extractedText)
                    .replace(/\n/g, '<br>')
                    .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')}</div>`;

            // Create structured content with the rendered PDF markup
            content = `<h1>PDF Document: ${safeFilename}</h1>

<blockquote>
<h3>Document Information</h3>
<p><strong>File Name:</strong> ${safeFilename}</p>
<p><strong>File Size:</strong> ${Math.round(result.size / 1024)} KB</p>
<p><strong>Pages:</strong> ${result.pages}</p>
<p><strong>Text Length:</strong> ${extractedText.length} characters</p>
</blockquote>

<h2>Extracted Content</h2>
${markupContent}`;

            logger.debug('PDF processed with extracted content');
            logger.debug('[PDF] Content length:', content.length);
            logger.debug('[PDF] Content preview:', content.substring(0, 200));

            // Update progress
            setImportedFiles((prev) =>
              prev.map((f) => (f.id === file.id ? { ...f, progress: 90 } : f))
            );
          }
          // Try Tiptap Pro Import for DOCX files
          else if (onTiptapImport && isDocx) {
            try {
              // Update progress
              setImportedFiles((prev) =>
                prev.map((f) => (f.id === file.id ? { ...f, progress: 50 } : f))
              );

              // Use Tiptap Pro conversion
              await onTiptapImport(originalFile, '');

              // Get content from editor after import
              content = 'Imported using Tiptap Pro';

              // Update progress
              setImportedFiles((prev) =>
                prev.map((f) => (f.id === file.id ? { ...f, progress: 90 } : f))
              );
            } catch (tiptapError) {
              logger.warn(
                'Tiptap Pro import failed, falling back to mammoth:',
                tiptapError
              );
              // Fall back to mammoth
              const arrayBuffer = await originalFile.arrayBuffer();
              const result = await mammoth.convertToHtml({ arrayBuffer });
              content = result.value;

              setImportedFiles((prev) =>
                prev.map((f) => (f.id === file.id ? { ...f, progress: 80 } : f))
              );
            }
          } else if (isDocx) {
            // Handle DOCX with mammoth fallback
            const arrayBuffer = await originalFile.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer });
            content = result.value;

            setImportedFiles((prev) =>
              prev.map((f) => (f.id === file.id ? { ...f, progress: 80 } : f))
            );
          } else if (isDoc) {
            // Handle DOC files
            throw new Error(
              'Legacy .doc files are not supported. Please convert to .docx format.'
            );
          } else {
            throw new Error('Unsupported file format');
          }

          // Mark as completed
          logger.debug(
            `[COMPLETION] Marking file ${file.name} as completed with content length:`,
            content.length
          );
          logger.debug(`[COMPLETION] Content preview:`, content.substring(0, 100));
          setImportedFiles((prev) => {
            const updated = prev.map((f) =>
              f.id === file.id
                ? {
                    ...f,
                    status: FILE_UPLOAD_STATUS.completed,
                    progress: 100,
                    content,
                  }
                : f
            );

            logger.debug(
              'Updated files after completion:',
              updated.map((f) => ({
                name: f.name,
                status: f.status,
                progress: f.progress,
              }))
            );

            // Check if all files are done processing (completed or error)
            const allDone = updated.every(
              (f) =>
                f.status === FILE_UPLOAD_STATUS.completed ||
                f.status === FILE_UPLOAD_STATUS.error
            );
            logger.debug('All files done?', allDone);
            if (allDone) {
              logger.debug('Setting isProcessing to false');
              setIsProcessing(false);
            }

            return updated;
          });
        } catch (error) {
          logger.error('Error processing file:', file.name, error);
          setImportedFiles((prev) => {
            const updated = prev.map((f) =>
              f.id === file.id
                ? {
                    ...f,
                    status: FILE_UPLOAD_STATUS.error,
                    progress: 0,
                    error:
                      error instanceof Error
                        ? error.message
                        : 'Failed to process file',
                  }
                : f
            );

            logger.debug(
              'Updated files after error:',
              updated.map((f) => ({
                name: f.name,
                status: f.status,
                error: f.error,
              }))
            );

            // Check if all files are done processing (completed or error)
            const allDone = updated.every(
              (f) =>
                f.status === FILE_UPLOAD_STATUS.completed ||
                f.status === FILE_UPLOAD_STATUS.error
            );
            logger.debug('All files done after error?', allDone);
            if (allDone) {
              logger.debug('Setting isProcessing to false after error');
              setIsProcessing(false);
            }

            return updated;
          });
        }
      }, delay);
    }, [onTiptapImport]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      logger.debug(
        'Files dropped:',
        acceptedFiles.map((f) => ({ name: f.name, type: f.type, size: f.size }))
      );
      setIsProcessing(true);

      const newFiles: ImportedFile[] = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        status: FILE_UPLOAD_STATUS.uploading,
        progress: 0,
        originalFile: file,
      }));

      logger.debug(
        'Created new files:',
        newFiles.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          status: f.status,
        }))
      );
      setImportedFiles((prev) => [...prev, ...newFiles]);

      // Process each file
      newFiles.forEach((file, index) => {
        logger.debug(
          `Starting to process file ${file.name} with delay ${index * 500}ms`
        );
        processWordFile(file, index * 500);
      });
    },
    [processWordFile]
  );

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const removeFile = (fileId: string) => {
    setImportedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const handleImport = () => {
    const completedFiles = importedFiles.filter(
      (f) => f.status === FILE_UPLOAD_STATUS.completed
    );

    const targetSection = preselectedSection || selectedSection;
    if (!targetSection || completedFiles.length === 0) {
      return;
    }

    const sanitizedFiles: ProcessedUploadedFile[] = completedFiles.map(
      ({ originalFile, ...rest }) => {
        void originalFile;
        return rest;
      }
    );

    onImportComplete?.(sanitizedFiles, targetSection, tags);

    // Reset form
    if (!preselectedSection) {
      setSelectedSection('');
    }
    setTags([]);
    setTagInput('');
    setImportedFiles([]);
    onOpenChange(false);
  };

  const formatFileSize = formatBytes;

  const getSelectedSectionName = () => {
    if (preselectedSection) {
      const section = sections.find((s) => s.id === preselectedSection);
      return section?.name || '';
    }
    return '';
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: WORD_IMPORT_ACCEPTED_FILE_TYPES,
    multiple: true,
  });

  // Set selected section when dialog opens and reset when closed
  React.useEffect(() => {
    logger.debug('Dialog open state changed:', { open, preselectedSection });
    if (open) {
      if (preselectedSection) {
        logger.debug(
          'Setting selectedSection to preselectedSection:',
          preselectedSection
        );
        setSelectedSection(preselectedSection);
      } else {
        logger.debug('No preselectedSection, clearing selectedSection');
        setSelectedSection('');
      }
    } else {
      // Reset state when dialog closes
      setSelectedSection(preselectedSection || '');
      setTags([]);
      setTagInput('');
      setImportedFiles([]);
      setIsProcessing(false);
    }
  }, [preselectedSection, open]);

  // Debug log to help identify the issue
  React.useEffect(() => {
    logger.debug('=== WORD IMPORT DIALOG DEBUG ===');
    logger.debug('selectedSection:', selectedSection);
    logger.debug('preselectedSection:', preselectedSection);
    logger.debug('importedFiles.length:', importedFiles.length);
    logger.debug(
      'completedFiles:',
      importedFiles.filter(
        (f) => f.status === FILE_UPLOAD_STATUS.completed
      ).length
    );
    logger.debug('isProcessing:', isProcessing);
    logger.debug('sections.length:', sections.length);
    logger.debug('sections:', sections);

    const isButtonDisabled =
      !selectedSection ||
      importedFiles.length === 0 ||
      importedFiles.filter((f) => f.status === FILE_UPLOAD_STATUS.completed)
        .length === 0 ||
      isProcessing;
    logger.debug('Button should be disabled:', isButtonDisabled);
    logger.debug('===============================');
  }, [
    selectedSection,
    preselectedSection,
    importedFiles,
    isProcessing,
    sections,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[85vh] overflow-hidden flex flex-col'>
        <DialogHeader className='pb-3 flex-shrink-0'>
          <DialogTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5 text-blue-600' />
            {preselectedSection
              ? `Import to ${getSelectedSectionName()}`
              : 'Import Documents'}
          </DialogTitle>
          <DialogDescription className='text-sm'>
            Import PDF or Microsoft Word documents (.pdf, .doc, .docx) and
            convert them to editable content.
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto space-y-4 min-h-0'>
          {/* File Upload Area */}
          <Card>
            <CardContent className='p-4'>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <FileText className='h-8 w-8 text-muted-foreground mx-auto mb-2' />
                <h3 className='font-medium text-foreground mb-1'>
                  {isDragActive ? 'Drop documents here' : 'Import Documents'}
                </h3>
                <p className='text-xs text-muted-foreground mb-2'>
                  Drag and drop .pdf, .doc, or .docx files, or click to select
                </p>
                <Button size='sm'>
                  <Upload className='h-4 w-4 mr-2' />
                  Choose Files
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Imported Files List */}
          {importedFiles.length > 0 && (
            <Card>
              <CardContent className='p-3'>
                <h3 className='font-medium text-foreground mb-2 text-sm'>
                  Processing Files ({importedFiles.length})
                </h3>
                <div className='space-y-2 max-h-32 overflow-y-auto'>
                  {importedFiles.map((file) => (
                    <div
                      key={file.id}
                      className='flex items-center gap-2 p-2 border rounded text-sm'
                    >
                      <FileIcon className='h-4 w-4 text-blue-600 flex-shrink-0' />

                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-1 mb-1'>
                          <p className='font-medium text-xs text-foreground truncate'>
                            {file.name}
                          </p>
                          <Badge
                            variant={
                              file.status === FILE_UPLOAD_STATUS.completed
                                ? 'default'
                                : file.status === FILE_UPLOAD_STATUS.error
                                ? 'destructive'
                                : 'secondary'
                            }
                            className='text-xs px-1 py-0'
                          >
                            {file.status}
                          </Badge>
                        </div>

                        <div className='text-xs text-muted-foreground'>
                          {formatFileSize(file.size)}
                          {file.status !== FILE_UPLOAD_STATUS.completed &&
                            file.status !== FILE_UPLOAD_STATUS.error && (
                              <span> • {file.progress}%</span>
                            )}
                        </div>

                        {(file.status === FILE_UPLOAD_STATUS.uploading ||
                          file.status === FILE_UPLOAD_STATUS.processing) && (
                          <Progress
                            value={file.progress}
                            className='h-1 mt-1'
                          />
                        )}

                        {file.error && (
                          <p className='text-xs text-destructive mt-1'>
                            {file.error}
                          </p>
                        )}
                      </div>

                      <div className='flex items-center gap-1'>
                        {file.status === FILE_UPLOAD_STATUS.completed && (
                          <CheckCircle className='h-3 w-3 text-green-500' />
                        )}
                        {file.status === FILE_UPLOAD_STATUS.error && (
                          <AlertCircle className='h-3 w-3 text-destructive' />
                        )}
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => removeFile(file.id)}
                          className='h-6 w-6 p-0'
                        >
                          <X className='h-3 w-3' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section Selection */}
          {!preselectedSection && (
            <div className='space-y-2 p-2 border-2 border-dashed border-yellow-300 bg-yellow-50 dark:bg-yellow-950 rounded'>
              <Label
                htmlFor='section-select'
                className='text-sm font-semibold text-yellow-800 dark:text-yellow-200'
              >
                🎯 Target Section (Required)
              </Label>
              <p className='text-xs text-yellow-700 dark:text-yellow-300'>
                Select which section to import your document into:
              </p>
              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Choose a section...' />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags Input */}
          <div className='space-y-2'>
            <Label htmlFor='tags-input' className='text-sm'>
              Tags (Optional)
            </Label>
            <div className='space-y-2'>
              {tags.length > 0 && (
                <div className='flex flex-wrap gap-1'>
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant='secondary'
                      className='flex items-center gap-1 px-1 py-0 text-xs'
                    >
                      {tag}
                      <X
                        className='h-2 w-2 cursor-pointer hover:text-destructive'
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}

              <div className='flex gap-2'>
                <Input
                  id='tags-input'
                  placeholder='Add a tag...'
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className='flex-1'
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className='pt-3 flex-shrink-0'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              !selectedSection ||
              importedFiles.length === 0 ||
              importedFiles.filter(
                (f) => f.status === FILE_UPLOAD_STATUS.completed
              ).length === 0 ||
              isProcessing
            }
          >
            Import Documents
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <span className='ml-1 text-xs opacity-50'>
                (S:{selectedSection ? '✓' : '✗'} F:{importedFiles.length} C:
                {
                  importedFiles.filter(
                    (f) => f.status === FILE_UPLOAD_STATUS.completed
                  ).length
                })
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

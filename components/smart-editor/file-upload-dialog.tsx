'use client';

// Author: Bin Lee (blee@filynai.com)
// Description: Modal dialog for uploading files from the workspace with basic validation.

import type React from 'react';

import { Loader2, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StoredDocumentWithUrl } from '@/lib/smart-editor/document-metadata';
import {
  FILE_EXTENSIONS,
  MIME_TYPES,
} from '@/lib/smart-editor/file-constants';
import type { ProcessedUploadedFile } from './document-upload';
import { DocumentUpload } from './document-upload';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: Array<{ id: string; name: string }>;
  onUploadComplete?: (result: {
    sectionId: string;
    sectionName: string;
    documents: StoredDocumentWithUrl[];
  }) => void;
  preselectedSection?: string | null;
}

const deriveTypeLabel = (file: ProcessedUploadedFile): string => {
  const name = file.name.toLowerCase();
  const type = file.type;

  if (type === MIME_TYPES.pdf || name.endsWith(FILE_EXTENSIONS.pdf)) {
    return 'PDF';
  }
  if (
    type === MIME_TYPES.wordProcessingMl ||
    name.endsWith(FILE_EXTENSIONS.wordProcessingMl)
  ) {
    return 'Word Document';
  }
  if (type === MIME_TYPES.msWord || name.endsWith(FILE_EXTENSIONS.msWord)) {
    return 'Word Document';
  }
  if (type === MIME_TYPES.markdown || name.endsWith(FILE_EXTENSIONS.markdown)) {
    return 'Markdown';
  }
  if (type === MIME_TYPES.plainText || name.endsWith(FILE_EXTENSIONS.plainText)) {
    return 'Text';
  }
  if (type === MIME_TYPES.html || name.endsWith(FILE_EXTENSIONS.html)) {
    return 'HTML';
  }

  return 'Document';
};

const buildTags = (
  file: ProcessedUploadedFile,
  baseTags: string[]
): string[] => {
  const tagSet = new Set(
    baseTags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)
  );

  const classification = file.indClassification;
  if (classification?.sectionCode) {
    tagSet.add('IND');
    if (classification.sectionTitle) {
      tagSet.add(classification.sectionTitle);
    }
    tagSet.add(`Module ${classification.sectionCode}`);
  }
  return Array.from(tagSet);
};

const cleanTitleFromFileName = (fileName: string): string => {
  return fileName.replace(/\.[^/.]+$/, '');
};

const generateSectionId = (sectionName: string): string => {
  const trimmed = sectionName.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_.]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export function FileUploadDialog({
  open,
  onOpenChange,
  sections,
  onUploadComplete,
  preselectedSection,
}: FileUploadDialogProps) {
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<ProcessedUploadedFile[]>([]);
  const [customSectionName, setCustomSectionName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadSessionKey, setUploadSessionKey] = useState(0);

  useEffect(() => {
    if (preselectedSection) {
      setSelectedSection(preselectedSection);
    } else {
      setSelectedSection('');
    }
    setCustomSectionName('');
  }, [preselectedSection]);

  useEffect(() => {
    if (
      open &&
      !preselectedSection &&
      sections.length > 0 &&
      !selectedSection
    ) {
      setSelectedSection(sections[0]?.id ?? '');
    }
  }, [open, preselectedSection, sections, selectedSection]);

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

  const requireSectionSelection = useMemo(
    () =>
      !preselectedSection &&
      sections.length > 0 &&
      customSectionName.trim().length === 0,
    [preselectedSection, sections, customSectionName]
  );

  const handleUpload = useCallback(async () => {
    if (uploadedFiles.length === 0) {
      setSubmitError('Add at least one file to upload.');
      return;
    }

    if (requireSectionSelection && !selectedSection) {
      setSubmitError('Select a section before uploading.');
      return;
    }

    const trimmedCustomName = customSectionName.trim();
    const derivedSectionId = trimmedCustomName
      ? generateSectionId(trimmedCustomName)
      : '';
    const fallbackSectionId = trimmedCustomName
      ? derivedSectionId || `section-${Date.now()}`
      : '';
    const existingSectionId = preselectedSection || selectedSection;

    const targetSectionId = trimmedCustomName
      ? fallbackSectionId
      : existingSectionId;

    if (!targetSectionId) {
      setSubmitError('Select or enter a section before uploading.');
      return;
    }

    const sectionName =
      trimmedCustomName ||
      sections.find((section) => section.id === targetSectionId)?.name ||
      targetSectionId;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const uploadedDocuments: StoredDocumentWithUrl[] = [];

      for (const file of uploadedFiles) {
        if (!file.originalFile) {
          throw new Error(
            `Original file data not available for "${file.name}". Please re-upload the file.`
          );
        }

        const metadata = {
          id: file.id,
          title: cleanTitleFromFileName(file.name),
          type: deriveTypeLabel(file),
          tags: buildTags(file, tags),
          content: file.content ?? null,
          textContent: file.textContent ?? null,
          indClassification: file.indClassification ?? null,
          originalPath: file.originalPath ?? null,
          warning: file.warning ?? null,
          sources: 1,
          starred: false,
        };

        const formData = new FormData();
        formData.append('file', file.originalFile);
        formData.append('sectionId', targetSectionId);
        formData.append('sectionName', sectionName);
        formData.append('metadata', JSON.stringify(metadata));

        const response = await fetch('/api/smart-editor/documents', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          let message = `Upload failed with status ${response.status}.`;
          try {
            const text = await response.text();
            if (text) {
              const parsed = JSON.parse(text) as { error?: string };
              if (parsed?.error) {
                message = parsed.error;
              } else if (text.trim()) {
                message = text.trim();
              }
            }
          } catch {
            // Ignore JSON parse errors and keep default message
          }
          throw new Error(message);
        }

        const json = (await response.json()) as {
          document: StoredDocumentWithUrl;
        };

        uploadedDocuments.push(json.document);
      }

      onUploadComplete?.({
        sectionId: targetSectionId,
        sectionName,
        documents: uploadedDocuments,
      });

      if (!preselectedSection) {
        setSelectedSection('');
      }
      setTags([]);
      setTagInput('');
      setCustomSectionName('');
      setUploadedFiles([]);
      setUploadSessionKey((key) => key + 1);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while uploading.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    uploadedFiles,
    requireSectionSelection,
    selectedSection,
    preselectedSection,
    sections,
    tags,
    onUploadComplete,
    onOpenChange,
    customSectionName,
  ]);

  const handleUploadComplete = (files: ProcessedUploadedFile[]) => {
    setSubmitError(null);
    setUploadedFiles(files);
  };

  const getSelectedSectionName = () => {
    if (preselectedSection) {
      const section = sections.find((s) => s.id === preselectedSection);
      return section?.name || '';
    }
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[85vh] overflow-hidden flex flex-col'>
        <DialogHeader className='pb-3 flex-shrink-0'>
          <DialogTitle>
            {preselectedSection
              ? `Upload to ${getSelectedSectionName()}`
              : 'Upload Documents'}
          </DialogTitle>
          <DialogDescription className='text-sm'>
            {preselectedSection
              ? 'Select files and add tags to organize your documents.'
              : 'Select files, choose a section, and add tags to organize your documents.'}
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto space-y-3 min-h-0'>
          {/* File Upload Component */}
          <DocumentUpload
            key={uploadSessionKey}
            onUploadComplete={handleUploadComplete}
          />

          {/* Section Selection - only show if no preselected section */}
          {!preselectedSection && (
            <div className='space-y-1'>
              <Label htmlFor='section-select'>Section</Label>
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

          {!preselectedSection && (
            <div className='space-y-1'>
              <Label htmlFor='custom-section-input'>New section (optional)</Label>
              <Input
                id='custom-section-input'
                placeholder='Enter a new section name...'
                value={customSectionName}
                onChange={(e) => setCustomSectionName(e.target.value)}
              />
              <p className='text-xs text-muted-foreground'>
                Leave empty to use an existing section. A new folder will be
                created if you provide a name.
              </p>
            </div>
          )}

          {submitError && (
            <p className='text-sm text-destructive'>{submitError}</p>
          )}

          {/* Tags Input */}
          <div className='space-y-1'>
            <Label htmlFor='tags-input'>Tags</Label>
            <div className='space-y-2'>
              {/* Current Tags */}
              {tags.length > 0 && (
                <div className='flex flex-wrap gap-1'>
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant='secondary'
                      className='flex items-center gap-1 px-2 py-0.5 text-xs'
                    >
                      {tag}
                      <X
                        className='h-3 w-3 cursor-pointer hover:text-destructive'
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add Tag Input */}
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
              <p className='text-xs text-muted-foreground'>
                Press Enter or click + to add tags
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className='pt-3 flex-shrink-0'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleUpload();
            }}
            disabled={
              uploadedFiles.length === 0 ||
              (requireSectionSelection && !selectedSection) ||
              isSubmitting
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Uploading...
              </>
            ) : (
              'Upload Documents'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

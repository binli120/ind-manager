'use client';

// Author: Bin Lee (blee@filynai.com)
// Description: Displays the hierarchical document list with section toggles and action controls.

import {
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  FolderOpen,
  Plus,
  Search,
  Star,
  Upload,
  X,
  Sparkles,
  RefreshCcw,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ProcessedUploadedFile } from './document-upload';
import type { StoredDocumentWithUrl } from '@/lib/smart-editor/document-metadata';
import type { IndClassification } from '@/lib/smart-editor/ind-classifier';
import { FileUploadDialog } from './file-upload-dialog';
import { SimpleTooltip } from './simple-tooltip';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { WordImportDialog } from './word-import-dialog';
import {
  FILE_EXTENSIONS,
  MIME_TYPES,
} from '@/lib/smart-editor/file-constants';

interface Document {
  id: string;
  title: string;
  type: string;
  lastModified: string;
  sources: number;
  starred: boolean;
  tags: string[];
  content?: string; // Optional content for imported documents
  pdfSource?: string;
  extractedText?: string;
  indClassification?: IndClassification;
  originalPath?: string;
  warning?: string;
  uploadedAt?: string;
  fileKey?: string;
  fileUrl?: string | null;
}

interface Section {
  id: string;
  name: string;
  expanded: boolean;
  documents: Document[];
}

interface FileListProps {
  sections: Section[];
  setSections: React.Dispatch<React.SetStateAction<Section[]>>;
  onDocumentSelect: (documentId: string) => void;
  selectedDocument: string | null;
  onExtractTopics?: () => void;
  onDocumentsUploaded?: (result: {
    sectionId: string;
    sectionName: string;
    documents: StoredDocumentWithUrl[];
  }) => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  loadError?: string | null;
  onRefreshSections?: () => void;
}

const tagColors: { [key: string]: string } = {
  FDA: 'bg-red-100 text-red-800 border-red-200',
  Schema: 'bg-blue-100 text-blue-800 border-blue-200',
  Pharmacodynamics: 'bg-purple-100 text-purple-800 border-purple-200',
  Process: 'bg-green-100 text-green-800 border-green-200',
  Submission: 'bg-orange-100 text-orange-800 border-orange-200',
  AI: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  Architecture: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Platform: 'bg-teal-100 text-teal-800 border-teal-200',
  IND: 'bg-pink-100 text-pink-800 border-pink-200',
  Development: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Optimization: 'bg-amber-100 text-amber-800 border-amber-200',
  Regulatory: 'bg-violet-100 text-violet-800 border-violet-200',
  Technical: 'bg-slate-100 text-slate-800 border-slate-200',
  Research: 'bg-rose-100 text-rose-800 border-rose-200',
  Analysis: 'bg-lime-100 text-lime-800 border-lime-200',
};

const getTagColor = (tag: string): string => {
  return tagColors[tag] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export function FileList({
  sections,
  setSections,
  onDocumentSelect,
  selectedDocument,
  onExtractTopics,
  onDocumentsUploaded,
  isLoading = false,
  isRefreshing = false,
  loadError = null,
  onRefreshSections,
}: FileListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'starred' | 'recent'>('all');
  const [newTagInput, setNewTagInput] = useState<{ [key: string]: string }>({});
  const [showTagInput, setShowTagInput] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [wordImportDialogOpen, setWordImportDialogOpen] = useState(false);
  const [selectedSectionForUpload, setSelectedSectionForUpload] = useState<
    string | null
  >(null);
  
  const fetchAndSetSections = async (prefix?: string | null) => {
    let url = `/api/smart-editor/sections?`;
    if (prefix != null)
      url = `/api/smart-editor/sections?prefix=${encodeURIComponent(prefix)}`;
    const res = await fetch(url);
    const data = await res.json();
    setSections(data.sections ?? []);
  };

  // Initialize: if no document is selected, select the first document from the first section
  useEffect(() => {
    if (!selectedDocument && sections.length > 0) {
      const firstSection = sections[0];
      if (firstSection.documents.length > 0) {
        onDocumentSelect(firstSection.documents[0].id);
      }
    }
  }, [selectedDocument, sections, onDocumentSelect]);

  const toggleSection = (sectionId: string) => {
    setSections(
      sections.map((section) => ({
        ...section,
        expanded: section.id === sectionId ? !section.expanded : false,
      }))
    );
  };

  const addTag = (documentId: string, tag: string) => {
    if (!tag.trim()) return;

    setSections(
      sections.map((section) => ({
        ...section,
        documents: section.documents.map((doc) =>
          doc.id === documentId && !doc.tags.includes(tag.trim())
            ? { ...doc, tags: [...doc.tags, tag.trim()] }
            : doc
        ),
      }))
    );
    setNewTagInput({ ...newTagInput, [documentId]: '' });
    setShowTagInput({ ...showTagInput, [documentId]: false });
  };

  const showTagInputField = (documentId: string) => {
    setShowTagInput({ ...showTagInput, [documentId]: true });
  };

  const hideTagInputField = (documentId: string) => {
    setShowTagInput({ ...showTagInput, [documentId]: false });
    setNewTagInput({ ...newTagInput, [documentId]: '' });
  };

  const removeTag = (documentId: string, tagToRemove: string) => {
    setSections(
      sections.map((section) => ({
        ...section,
        documents: section.documents.map((doc) =>
          doc.id === documentId
            ? { ...doc, tags: doc.tags.filter((tag) => tag !== tagToRemove) }
            : doc
        ),
      }))
    );
  };

  const getFilteredSections = () => {
    return sections
      .map((section) => ({
        ...section,
        documents: section.documents.filter((doc) => {
          const matchesSearch =
            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.tags.some((tag) =>
              tag.toLowerCase().includes(searchQuery.toLowerCase())
            );
          const uploadedTime = doc.uploadedAt
            ? new Date(doc.uploadedAt).getTime()
            : null;
          const isRecent =
            uploadedTime !== null &&
            !Number.isNaN(uploadedTime) &&
            Date.now() - uploadedTime <= 7 * 24 * 60 * 60 * 1000;
          const matchesFilter =
            filter === 'all' ||
            (filter === 'starred' && doc.starred) ||
            (filter === 'recent' && isRecent);
          return matchesSearch && matchesFilter;
        }),
      }))
      .filter((section) => section.documents.length > 0 || searchQuery === '');
  };

  const handleUploadComplete = (result: {
    sectionId: string;
    sectionName: string;
    documents: StoredDocumentWithUrl[];
  }) => {
    onDocumentsUploaded?.(result);
    if (result.documents.length > 0) {
      onDocumentSelect(result.documents[0].id);
    }
  };

  const handleSectionUpload = (sectionId: string) => {
    setSelectedSectionForUpload(sectionId);
    setUploadDialogOpen(true);
  };

  const handleSectionWordImport = (sectionId: string) => {
    setSelectedSectionForUpload(sectionId);
    setWordImportDialogOpen(true);
  };

  const handleGeneralUpload = () => {
    setSelectedSectionForUpload(null);
    setUploadDialogOpen(true);
  };

  const handleWordImportComplete = (
    files: ProcessedUploadedFile[],
    sectionId: string,
    tags: string[]
  ) => {
    const newDocuments = files.map((file, index) => {
      // Determine file type and clean title based on file extension
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

      let type = 'Document';
      let cleanTitle = file.name;

      if (isPdf) {
        type = 'PDF';
        cleanTitle = file.name.replace(
          new RegExp(`${FILE_EXTENSIONS.pdf}$`, 'i'),
          ''
        );
      } else if (isDocx) {
        type = 'Word Document';
        cleanTitle = file.name.replace(
          new RegExp(`${FILE_EXTENSIONS.wordProcessingMl}$`, 'i'),
          ''
        );
      } else if (isDoc) {
        type = 'Word Document';
        cleanTitle = file.name.replace(
          new RegExp(`${FILE_EXTENSIONS.msWord}$`, 'i'),
          ''
        );
      }

      return {
        id: `import-${Date.now()}-${index}`,
        title: cleanTitle,
        type: type,
        lastModified: 'Just now',
        sources: 1,
        starred: false,
        tags: [...tags, 'Imported'],
        content: file.content, // Store the converted content
        pdfSource: file.pdfDataUrl ?? undefined,
        extractedText: file.textContent ?? undefined,
        uploadedAt: new Date().toISOString(),
      };
    });

    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, documents: [...section.documents, ...newDocuments] }
          : section
      )
    );
  };
  
  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='p-4 border-b border-sidebar-border'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold text-sidebar-foreground'>
            Sources
          </h2>
          <div className='flex items-center gap-2'>
            <SimpleTooltip content='Refresh sections from storage'>
              <Button
                size='sm'
                variant='outline'
                className='text-xs'
                onClick={() => onRefreshSections?.()}
                disabled={!onRefreshSections || isRefreshing}
              >
                <RefreshCcw
                  className={`h-4 w-4 ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                />
              </Button>
            </SimpleTooltip>
            
            <SimpleTooltip content='Upload files'>
              <Button
                size='sm'
                className='bg-primary text-primary-foreground hover:bg-primary/90'
                onClick={handleGeneralUpload}
              >
                <Upload className='h-4 w-4 mr-2' />
                Add
              </Button>
            </SimpleTooltip>
          </div>
        </div>

        {/* Search */}
        <div className='relative mb-4'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search sources and tags...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10 bg-background'
          />
        </div>

        {loadError && (
          <div className='mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive'>
            {loadError}
          </div>
        )}

        {isLoading && sections.length === 0 && (
          <div className='mb-3 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground'>
            Loading sections...
          </div>
        )}

        {onExtractTopics && (
          <div className='mb-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={onExtractTopics}
              className='w-full justify-start'
            >
              <Sparkles className='h-4 w-4 mr-2' />
              Analyze Topics
            </Button>
          </div>
        )}

        {/* Filters */}
        <div className='flex gap-2'>
          <SimpleTooltip content='Show all documents'>
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setFilter('all')}
            >
              <FolderOpen className='h-4 w-4 mr-1' />
              All
            </Button>
          </SimpleTooltip>
          <SimpleTooltip content='Show starred documents'>
            <Button
              variant={filter === 'starred' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setFilter('starred')}
            >
              <Star className='h-4 w-4 mr-1' />
              Starred
            </Button>
          </SimpleTooltip>
          <SimpleTooltip content='Show recently modified documents'>
            <Button
              variant={filter === 'recent' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setFilter('recent')}
            >
              <Clock className='h-4 w-4 mr-1' />
              Recent
            </Button>
          </SimpleTooltip>
        </div>
      </div>

      {/* Document Tree */}
      <ScrollArea className='flex-1'>
        <div className='p-2'>
          {sections.length === 0 && !isLoading && (
            <div className='px-2 py-4 text-sm text-muted-foreground'>
              No sections found. Upload a document to create the first section.
            </div>
          )}
          {getFilteredSections().map((section) => (
            <div key={section.id} className='mb-2'>
              <div className='flex items-center justify-between p-3 bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 hover:bg-slate-200/70 dark:hover:bg-slate-800/70 rounded-lg group transition-colors'>
                <div
                  className='flex items-center gap-3 cursor-pointer flex-1'
                  onClick={() => toggleSection(section.id)}
                >
                  {section.expanded ? (
                    <ChevronDown className='h-4 w-4 text-slate-600 dark:text-slate-300' />
                  ) : (
                    <ChevronRight className='h-4 w-4 text-slate-600 dark:text-slate-300' />
                  )}
                  <FolderOpen className='h-5 w-5 text-amber-600 dark:text-amber-500' />
                  <span className='font-semibold text-sm text-slate-800 dark:text-slate-100 tracking-wide'>
                    {section.name}
                  </span>
                  <Badge
                    variant='secondary'
                    className='text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                  >
                    {section.documents.length}
                  </Badge>
                </div>
                <div className='flex items-center gap-1'>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size='sm'
                        variant='ghost'
                        className='h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-300/70 dark:hover:bg-slate-600/70'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSectionWordImport(section.id);
                        }}
                      >
                        <FileText className='h-4 w-4 text-slate-600 dark:text-slate-300' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Import Word Document</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size='sm'
                        variant='ghost'
                        className='h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-300/70 dark:hover:bg-slate-600/70'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSectionUpload(section.id);
                        }}
                      >
                        <Plus className='h-4 w-4 text-slate-600 dark:text-slate-300' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Upload Files</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {section.expanded && (
                <div className='ml-8 mt-2 space-y-1 border-l-2 border-slate-200/60 dark:border-slate-700/50 pl-4'>
                  {/*Breadcrumb for going to previous folders*/}
                  <nav className="flex items-center gap-1">
                    <button
                      onClick={() => fetchAndSetSections(null)}
                      className="hover:underline"
                    >
                      All
                    </button>

                    {sections.length === 1 && (() => {
                      const parts = sections[0].id.split('/').filter(Boolean);
                      const short = parts.slice(-2); // only last 2 segments

                      return short.map((seg, i) => {
                        const prefixUpToHere = parts.slice(0, parts.length - short.length + i + 1).join('/');
                        return (
                          <span key={prefixUpToHere} className="flex items-center gap-1">
                            <span className="opacity-50">/</span>
                            <button
                              onClick={() => fetchAndSetSections(prefixUpToHere)}
                              className="hover:underline"
                            >
                              {seg}
                            </button>
                          </span>
                        );
                      });
                    })()}
                  </nav>
                  {/*Breadcrumb for going to previous folders*/}

                  {section.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`p-3 rounded-md cursor-pointer transition-colors border ${
                        selectedDocument === doc.id
                          ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
                          : 'bg-white dark:bg-slate-900/50 border-slate-200/40 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                      onClick={() => {
                        if (doc.type === 'folder') {
                          fetchAndSetSections(doc.id);
                        } else {
                          onDocumentSelect(doc.id);
                        }
                      }}
                    >
                      <div className='flex items-start gap-3'>
                        {doc.type === 'folder' ? (
                          <FolderOpen className='h-4 w-4 text-amber-600 dark:text-blue-400 mt-0.5 flex-shrink-0' />
                        ) : (
                          <FileText className='h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0' />
                        )}
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 mb-1'>
                            <h3
                              className={`font-medium text-sm leading-tight line-clamp-2 ${
                                selectedDocument === doc.id
                                  ? 'text-blue-900 dark:text-blue-100'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {doc.title}
                            </h3>
                            {doc.starred && (
                              <Star className='h-3 w-3 text-yellow-500 fill-current flex-shrink-0' />
                            )}
                          </div>
                          {selectedDocument === doc.id && (
                            doc.originalPath ? (
                              <p
                                className='text-[11px] text-slate-500 dark:text-slate-400 mb-2 truncate'
                                title={doc.originalPath}
                              >
                                {doc.originalPath}
                              </p>
                            ) : (
                              <p className='text-[11px] text-slate-400 dark:text-slate-500 mb-2'>
                                Full file path not available (browser privacy safeguard).
                              </p>
                            )
                          )}

                          {/* Only show metadata and tags for selected document */}
                          {selectedDocument === doc.id && (
                            <>
                              <div
                                className={`flex items-center gap-2 text-xs mb-2 ${
                                  selectedDocument === doc.id
                                    ? 'text-blue-700 dark:text-blue-300'
                                    : 'text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                <Badge
                                  variant='secondary'
                                  className='text-xs px-1.5 py-0.5'
                                >
                                  {doc.type}
                                </Badge>
                                <span>{doc.sources} sources</span>
                                <span>•</span>
                                <span>{doc.lastModified}</span>
                              </div>

                              <div className='space-y-2'>
                                <div className='flex flex-wrap gap-1'>
                                  {doc.tags.map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant='outline'
                                      className={`text-xs px-2 py-0.5 flex items-center gap-1 border ${getTagColor(
                                        tag
                                      )}`}
                                    >
                                      {tag}
                                      <X
                                        className='h-2 w-2 cursor-pointer hover:text-destructive'
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeTag(doc.id, tag);
                                        }}
                                      />
                                    </Badge>
                                  ))}
                                  {!showTagInput[doc.id] && (
                                    <Button
                                      size='sm'
                                      variant='ghost'
                                      className='h-6 w-auto px-2 py-0 text-xs border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50'
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        showTagInputField(doc.id);
                                      }}
                                    >
                                      <Plus className='h-3 w-3 mr-1' />
                                      Add tag
                                    </Button>
                                  )}
                                </div>

                                {showTagInput[doc.id] && (
                                  <div className='flex gap-1'>
                                    <Input
                                      placeholder='Add tag...'
                                      value={newTagInput[doc.id] || ''}
                                      onChange={(e) =>
                                        setNewTagInput({
                                          ...newTagInput,
                                          [doc.id]: e.target.value,
                                        })
                                      }
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          e.stopPropagation();
                                          addTag(
                                            doc.id,
                                            newTagInput[doc.id] || ''
                                          );
                                        } else if (e.key === 'Escape') {
                                          e.stopPropagation();
                                          hideTagInputField(doc.id);
                                        }
                                      }}
                                      onBlur={() => {
                                        // Delay to allow click on add button
                                        setTimeout(
                                          () => hideTagInputField(doc.id),
                                          150
                                        );
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className='text-xs h-6 flex-1'
                                      autoFocus
                                    />
                                    <Button
                                      size='sm'
                                      variant='ghost'
                                      className='h-6 w-6 p-0'
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addTag(
                                          doc.id,
                                          newTagInput[doc.id] || ''
                                        );
                                      }}
                                    >
                                      <Plus className='h-3 w-3' />
                                    </Button>
                                    <Button
                                      size='sm'
                                      variant='ghost'
                                      className='h-6 w-6 p-0'
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        hideTagInputField(doc.id);
                                      }}
                                    >
                                      <X className='h-3 w-3' />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* File Upload Dialog */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        sections={sections.map((s) => ({ id: s.id, name: s.name }))}
        onUploadComplete={handleUploadComplete}
        preselectedSection={selectedSectionForUpload}
      />

      {/* Word Import Dialog */}
      <WordImportDialog
        open={wordImportDialogOpen}
        onOpenChange={setWordImportDialogOpen}
        sections={sections.map((s) => ({ id: s.id, name: s.name }))}
        onImportComplete={handleWordImportComplete}
        preselectedSection={selectedSectionForUpload}
        onTiptapImport={async (file: File) => {
          // This will be called when we need to use Tiptap import
          // For now, we'll handle this in the dialog component
          console.log('Tiptap import requested for file:', file.name);
        }}
      />
    </div>
  );
}

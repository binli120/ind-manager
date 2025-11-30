'use client';

// Author: Bin Lee (blee@filynai.com)
// Description: Renders the main document editor view with toolbar integration and assistant chat support.

import { Copy, Download, FileText, MoreHorizontal, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { createLogger } from '@/lib/smart-editor/logger';
import { convertPlainTextToHtml } from '@/lib/smart-editor/text-utils';
import type { AssistantApi } from '@/lib/smart-editor/assistant-types';
import type { IndClassification } from '@/lib/smart-editor/ind-classifier';
import { ChatInterface } from './chat-interface';
import { TiptapEditor } from './tiptap-editor';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select';
import {
  createPdfEmbedHtml,
  DEFAULT_PDF_EMBED_HEIGHT,
} from '@/lib/smart-editor/tiptap-pdf-embed';

interface Document {
  id: string;
  title: string;
  type: string;
  lastModified: string;
  sources: number;
  starred: boolean;
  tags: string[];
  content?: string;
  pdfSource?: string;
  fileUrl?: string | null;
  extractedText?: string;
  indClassification?: IndClassification;
  originalPath?: string;
  warning?: string;
}

interface DocumentViewerProps {
  selectedDocument: string | null;
  document: Document | null;
  sectionName?: string | null;
  sectionId?: string | null;
  sectionDocuments?: Document[];
}

export function DocumentViewer({
  selectedDocument,
  document,
  sectionName,
  sectionId,
  sectionDocuments = [],
}: DocumentViewerProps) {
  const logger = createLogger('DocumentViewer');
  const [editorMethods, setEditorMethods] = useState<{
    importWordFile: (file: File) => Promise<void>;
    exportAsDocx: () => Promise<void>;
    exportAsHtml: () => void;
    assistant?: AssistantApi;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const assistantApi = editorMethods?.assistant;

  const handleEditorReady = (methods: {
    importWordFile: (file: File) => Promise<void>;
    exportAsDocx: () => Promise<void>;
    exportAsHtml: () => void;
    assistant?: AssistantApi;
  }) => {
    setEditorMethods(methods);
  };

  const handleSave = (content: string, format: 'json' | 'html' | 'docx') => {
    logger.info(`Saving document in ${format} format`, { length: content.length });
    // Here you could implement actual save functionality
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !editorMethods) return;

    try {
      await editorMethods.importWordFile(file);
    } catch (error) {
      logger.error('Import failed:', error);
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'import':
        fileInputRef.current?.click();
        break;
      case 'export-docx':
        editorMethods?.exportAsDocx();
        break;
      case 'export-html':
        // Export HTML functionality would go here
        logger.info('Export HTML requested');
        break;
      default:
        break;
    }
  };

  if (!selectedDocument || !document) {
    return (
      <div className='flex-1 flex flex-col bg-background relative'>
        {/* Document Content Area */}
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-center'>
            <FileText className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
            <h3 className='text-lg font-medium text-foreground mb-2'>
              No document selected
            </h3>
            <p className='text-muted-foreground'>
              Select a document from the sources panel to view its content
            </p>
          </div>
        </div>

        {/* Chat Interface - Positioned at bottom of document view area */}
        <div className='absolute bottom-8 left-0 right-0 border-t border-border bg-background shadow-lg z-40'>
          <ChatInterface
            selectedDocument={selectedDocument}
            documentTitle={null}
            sectionName={sectionName}
          />
        </div>
      </div>
    );
  }

  const classification =
    document.indClassification &&
    (document.indClassification.sectionCode ||
      document.indClassification.confidence > 0)
      ? document.indClassification
      : null;

  const resolvedPdfSource =
    document.pdfSource?.trim()?.length
      ? document.pdfSource
      : document.fileUrl?.trim()?.length
      ? document.fileUrl
      : null;

  const hasHtmlContent =
    typeof document.content === 'string' && document.content.trim().length > 0;
  const hasExtractedText =
    typeof document.extractedText === 'string' &&
    document.extractedText.trim().length > 0;
  const contentHasPdfEmbed =
    typeof document.content === 'string' &&
    document.content.includes('data-type="pdf-embed"');

  const pdfEmbedMarkup =
    resolvedPdfSource && resolvedPdfSource.trim().length > 0
      ? createPdfEmbedHtml({
          src: resolvedPdfSource,
          title: document.title,
          height: DEFAULT_PDF_EMBED_HEIGHT,
        })
      : null;

  const baseContent = hasHtmlContent
    ? document.content ?? ''
    : hasExtractedText && document.extractedText
    ? convertPlainTextToHtml(document.extractedText)
    : '';

  const resolvedDocumentContent =
    pdfEmbedMarkup && !contentHasPdfEmbed
      ? [pdfEmbedMarkup, baseContent].filter(Boolean).join('\n\n')
      : baseContent;

  return (
    <div className='flex-1 flex flex-col overflow-hidden relative'>
      {/* Document Content Area - Full height with bottom padding for chat */}
      <div
        className='flex-1 flex flex-col overflow-hidden'
        style={{ paddingBottom: '8rem' }} // Padding for chat space at bottom
      >
        {/* Document Header - Fixed */}
        <div className='border-b border-border bg-card px-6 py-4 flex-shrink-0'>
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <FileText className='h-5 w-5 text-primary' />
                <h1 className='text-xl font-semibold text-foreground line-clamp-2'>
                  {document.title}
                </h1>
              </div>
              {document.originalPath && (
                <p
                  className='text-xs text-muted-foreground mb-2 truncate'
                  title={document.originalPath}
                >
                  {document.originalPath}
                </p>
              )}
              {!document.originalPath && (
                <p className='text-xs text-muted-foreground mb-2'>
                  Full file path unavailable (restricted by browser security).
                </p>
              )}
              <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                <Badge variant='secondary'>{document.type}</Badge>
                <span>
                  {document.content ? document.content.split(/\s+/).length : 0}{' '}
                  words
                </span>
                <span>{document.sources} sources</span>
                <span>Modified {document.lastModified}</span>
              </div>
              {classification && (
                <div className='mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                  <Badge variant='outline' className='px-1.5 py-0.5'>
                    {classification.sectionCode ?? 'Unassigned'}
                  </Badge>
                  <span className='font-medium text-foreground'>
                    {classification.sectionTitle}
                  </span>
                  <span>
                    Confidence {Math.round(classification.confidence * 100)}%
                  </span>
                  {classification.matchedTerms.length > 0 && (
                    <span className='text-muted-foreground/70'>
                      Matched: {classification.matchedTerms.slice(0, 3).join(', ')}
                      {classification.matchedTerms.length > 3 ? '…' : ''}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className='flex items-center gap-2'>
              <input
                type='file'
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept='.pdf,.docx,.txt,.html'
                className='hidden'
              />
              <Button variant='ghost' size='sm'>
                <Copy className='h-4 w-4' />
              </Button>
              <Button variant='ghost' size='sm'>
                <Download className='h-4 w-4' />
              </Button>
              <Select onValueChange={handleMenuAction}>
                <SelectTrigger className='w-auto h-9 px-2 border-none bg-transparent hover:bg-accent data-[state=open]:bg-accent [&>span]:hidden'>
                  <MoreHorizontal className='h-4 w-4' />
                </SelectTrigger>
                <SelectContent align='end'>
                  <SelectItem value='import'>
                    <div className='flex items-center gap-2'>
                      <Upload className='h-4 w-4' />
                      Import Word Document
                    </div>
                  </SelectItem>
                  <SelectItem value='export-docx'>
                    <div className='flex items-center gap-2'>
                      <Download className='h-4 w-4' />
                      Export as DOCX
                    </div>
                  </SelectItem>
                  <SelectItem value='export-html'>
                    <div className='flex items-center gap-2'>
                      <FileText className='h-4 w-4' />
                      Export as HTML
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tiptap Editor - Scrollable Content */}
        <div className='flex-1 overflow-hidden'>
          <ScrollArea className='h-full'>
            <div className='p-6'>
              <TiptapEditor
                key={document.id} // Force re-render when document changes
                content={
                  resolvedDocumentContent ||
                  `<h1>${document.title}</h1>\n\n<p>Start editing your document...</p>`
                }
                pdfSource={resolvedPdfSource}
                onSave={handleSave}
                onEditorReady={(methods) => {
                  handleEditorReady(methods);
                }}
                placeholder='Start editing your document...'
                className='min-h-full'
                sectionName={sectionName}
                sectionId={sectionId}
                sectionDocuments={sectionDocuments}
                documentTitle={document.title}
                document={document}
              />
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Chat Interface - Positioned at bottom of document view area */}
      <div className='absolute bottom-8 left-0 right-0 border-t border-border bg-background shadow-lg z-40'>
        <ChatInterface
          selectedDocument={selectedDocument}
          documentTitle={document?.title}
          sectionName={sectionName}
          assistantApi={assistantApi}
        />
      </div>
    </div>
  );
}

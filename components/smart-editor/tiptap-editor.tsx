'use client';

// Author: Bin Lee (blee@filynai.com)
// Description: Hosts the primary Tiptap editor instance, integrating uploads, summaries, gap analysis, and assistant APIs.
import type {
  AssistantApi,
  AssistantCommandHint,
  AssistantCommandOptions,
  AssistantCommandResult,
} from '@/lib/smart-editor/assistant-types';
import {
  FILE_EXTENSIONS,
  MIME_TYPES,
  UPLOAD_ACCEPT_ATTRIBUTE,
  UPLOAD_SUPPORTED_LABEL,
} from '@/lib/smart-editor/file-constants';
import { createLogger } from '@/lib/smart-editor/logger';
import { getCachedPdfText, setCachedPdfText } from '@/lib/smart-editor/pdf-cache';
import {
  convertPDFTextToHTML,
  parsePdfDate,
  type PDFExtractionResult,
} from '@/lib/smart-editor/pdf-utils';
import {
  PdfEmbed,
  createPdfEmbedHtml,
  normalizePdfEmbedHtml,
  parsePdfEmbedAttributes,
  DEFAULT_PDF_EMBED_HEIGHT,
} from '@/lib/smart-editor/tiptap-pdf-embed';
import { fileToDataUrl } from '@/lib/smart-editor/utils';
import { Ai } from '@tiptap-pro/extension-ai';
import { Export } from '@tiptap-pro/extension-export';
import { Import } from '@tiptap-pro/extension-import';
import type { JSONContent } from '@tiptap/core';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { Image } from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Typography } from '@tiptap/extension-typography';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Clock,
  Code,
  Edit3,
  Eye,
  FileSearch,
  FileText,
  Hash,
  Image as ImageIcon,
  Italic,
  Lightbulb,
  List,
  ListOrdered,
  Loader2,
  MessageSquare,
  Quote,
  Save,
  Sparkles,
  Star,
  Table as TableIcon,
  Underline,
  Upload,
} from 'lucide-react';
import mammoth from 'mammoth';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { findSuggestionPattern } from '@/lib/smart-editor/simple-suggestions';
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
import { Separator } from '../ui/separator';

function extractPdfEmbedInfoFromHtml(html: string) {
  if (typeof window === 'undefined') {
    return { embedHtml: null as string | null, src: null as string | null };
  }

  const container = window.document.createElement('div');
  container.innerHTML = html;
  const embedEl = container.querySelector(
    'div[data-type="pdf-embed"]'
  ) as HTMLElement | null;
  if (!embedEl) {
    return { embedHtml: null, src: null };
  }

  const embedHtml = embedEl.outerHTML;
  const src = embedEl.getAttribute('data-src');

  return { embedHtml, src };
}

function stripPdfEmbedFromHtml(html: string): {
  cleaned: string;
  embedHtml: string | null;
} {
  if (!html) {
    return { cleaned: '', embedHtml: null };
  }

  const regex = /<div[^>]*data-type=["']pdf-embed["'][^>]*>[\s\S]*?<\/div>/gi;
  const matches = html.match(regex);

  if (!matches || matches.length === 0) {
    return { cleaned: html, embedHtml: null };
  }

  const embedHtml = matches[0];
  const cleaned = html.replace(regex, '').trim();

  return {
    cleaned,
    embedHtml,
  };
}

function normalizeHtmlForComparison(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (
    trimmed === '<p></p>' ||
    trimmed === '<p></p>\n' ||
    trimmed === '<p></p>\r\n'
  ) {
    return '';
  }

  return trimmed;
}

function extractSectionCodeHint(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const match = value.match(/[0-9]+(?:\.[0-9]+)+/);
  return match ? match[0] : null;
}

function convertHtmlToMarkdown(html: string): string {
  if (!html) return '';

  let markdown = html;
  markdown = markdown.replace(/\r\n/g, '\n');
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gis, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gis, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gis, '### $1\n\n');
  markdown = markdown.replace(/<p[^>]*>/gi, '\n\n');
  markdown = markdown.replace(/<\/p>/gi, '');
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gis, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gis, '**$1**');
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gis, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gis, '*$1*');
  markdown = markdown.replace(/<ul[^>]*>/gi, '\n');
  markdown = markdown.replace(/<\/ul>/gi, '\n');
  markdown = markdown.replace(/<ol[^>]*>/gi, '\n');
  markdown = markdown.replace(/<\/ol>/gi, '\n');
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gis, '- $1\n');
  markdown = markdown.replace(/<table[^>]*>/gi, '\n');
  markdown = markdown.replace(/<\/table>/gi, '\n');
  markdown = markdown.replace(/<tr[^>]*>/gi, '\n');
  markdown = markdown.replace(/<\/tr>/gi, '\n');
  markdown = markdown.replace(/<th[^>]*>(.*?)<\/th>/gis, '**$1**\t');
  markdown = markdown.replace(/<td[^>]*>(.*?)<\/td>/gis, '$1\t');
  markdown = markdown.replace(/<div[^>]*>/gi, '\n');
  markdown = markdown.replace(/<\/div>/gi, '\n');
  markdown = markdown.replace(/&nbsp;/gi, ' ');
  markdown = markdown.replace(/<[^>]+>/g, '');

  if (typeof window !== 'undefined') {
    const textarea = window.document.createElement('textarea');
    textarea.innerHTML = markdown;
    markdown = textarea.value;
  }

  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  return markdown.trim();
}

function isAbsoluteUrl(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  return /^https?:\/\//i.test(value);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMarkdownAsHtml(markdown: string): string {
  return `<pre class="markdown-view">${escapeHtml(markdown)}</pre>`;
}

interface SectionDocumentInfo {
  id: string;
  title: string;
  type: string;
  lastModified: string;
  sources: number;
  starred: boolean;
  tags: string[];
  content?: string;
  pdfSource?: string;
  extractedText?: string;
  awaitingExtraction?: boolean;
  paragraphs?: Array<{ id: string; text: string; lowerText: string }>;
  text?: string;
}

interface TiptapEditorProps {
  content?: string;
  onContentChange?: (content: string) => void;
  onSave?: (content: string, format: 'json' | 'html' | 'docx') => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  onEditorReady?: (methods: {
    importWordFile: (file: File) => Promise<void>;
    exportAsDocx: () => Promise<void>;
    exportAsHtml: () => void;
    assistant?: AssistantApi;
  }) => void;
  sectionName?: string | null;
  sectionId?: string | null;
  sectionDocuments?: SectionDocumentInfo[];
  documentTitle?: string | null;
  pdfSource?: string | null;
}

interface DocumentStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
}

interface DocumentTopic {
  id: string;
  title: string;
  searchText: string; // Text to search for in document to find the location
  confidence: number;
}

interface TopicExtractionState {
  topics: DocumentTopic[];
  isExtracting: boolean;
  error: string | null;
}

interface SmartSuggestion {
  text: string;
  context: string;
  type: 'section' | 'topic' | 'continuation' | 'structure';
  category: string;
}

interface SuggestionState {
  isVisible: boolean;
  position: { top: number; left: number } | null;
  suggestedText: string;
  triggerText: string;
  context: 'section' | 'topic' | 'continuation' | 'structure';
  showDialog: boolean;
  suggestion: SmartSuggestion | null;
}

interface SummaryDialogState {
  isOpen: boolean;
  sourceSectionName: string;
  targetSectionName: string;
  sourceDocuments: Array<{ id: string; title: string; type: string }>;
}

type ImportCommandOptions = {
  file: ArrayBuffer;
  format: 'docx';
  appId: string;
  token: string;
};

type ImportCommandFn = (options: ImportCommandOptions) => Promise<void>;

type ExportCommandOptions = {
  format: 'docx';
  appId: string;
  token: string;
};

type ExportCommandResult = {
  blob?: Blob;
};

type ExportCommandFn = (
  options: ExportCommandOptions
) => Promise<ExportCommandResult | void>;

type JsonMark = {
  type?: string;
};

type CommandWithOptions = (options: Record<string, unknown>) => unknown;

function getEditorCommand<T>(
  commands: Record<string, unknown>,
  key: string
): T | null {
  const command = commands[key];
  return typeof command === 'function' ? (command as T) : null;
}

type GapAnalysisGateState = {
  ready: boolean;
  message: string | null;
  status: 'info' | 'error' | 'success';
};

export function TiptapEditor({
  content = '',
  onContentChange,
  onSave,
  placeholder = 'Start typing your document...',
  editable = true,
  className = '',
  sectionName = null,
  sectionId = null,
  sectionDocuments = [],
  documentTitle = null,
  pdfSource = null,
  onEditorReady,
}: TiptapEditorProps) {
  const logger = createLogger('TiptapEditor');
  const { cleaned: sanitizedContent, embedHtml: initialPdfEmbed } = useMemo(
    () => stripPdfEmbedFromHtml(content),
    [content]
  );
  const resolvedInitialPdfEmbed = useMemo(() => {
    const normalized = normalizePdfEmbedHtml(initialPdfEmbed);
    if (normalized) {
      const attrs = parsePdfEmbedAttributes(normalized);
      if (attrs && pdfSource && !isAbsoluteUrl(attrs.src)) {
        return createPdfEmbedHtml({
          src: pdfSource,
          title: documentTitle ?? attrs.title ?? undefined,
          height: attrs.height ?? DEFAULT_PDF_EMBED_HEIGHT,
        });
      }
      return normalized;
    }

    if (pdfSource) {
      return createPdfEmbedHtml({
        src: pdfSource,
        title: documentTitle ?? undefined,
        height: DEFAULT_PDF_EMBED_HEIGHT,
      });
    }
    return null;
  }, [documentTitle, initialPdfEmbed, pdfSource]);
  const [isEditing, setIsEditing] = useState(editable);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfEmbedHtml, setPdfEmbedHtml] = useState<string | null>(
    resolvedInitialPdfEmbed
  );
  const rawPdfEmbedAttributes = useMemo(
    () => parsePdfEmbedAttributes(pdfEmbedHtml),
    [pdfEmbedHtml]
  );

  const pdfViewAttributes = useMemo(() => {
    if (rawPdfEmbedAttributes) {
      if (!isAbsoluteUrl(rawPdfEmbedAttributes.src) && pdfSource) {
        return {
          ...rawPdfEmbedAttributes,
          src: pdfSource,
        };
      }
      return rawPdfEmbedAttributes;
    }

    if (pdfSource) {
      return {
        src: pdfSource,
        title: documentTitle ?? undefined,
        height: DEFAULT_PDF_EMBED_HEIGHT,
      };
    }

    return null;
  }, [documentTitle, pdfSource, rawPdfEmbedAttributes]);
  const [scannedMarkup, setScannedMarkup] = useState<string | null>(null);
  const [scannedMarkdown, setScannedMarkdown] = useState<string | null>(null);
  const initialViewMode: 'pdf' | 'html' | 'markdown' = resolvedInitialPdfEmbed
    ? 'pdf'
    : 'markdown';
  const [viewMode, setViewMode] = useState<'pdf' | 'html' | 'markdown'>(
    initialViewMode
  );
  const [scanWarning, setScanWarning] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const viewModeRef = useRef(initialViewMode);

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [stats, setStats] = useState<DocumentStats>({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
  });
  const [topicState, setTopicState] = useState<TopicExtractionState>({
    topics: [],
    isExtracting: false,
    error: null,
  });
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [suggestionState, setSuggestionState] = useState<SuggestionState>({
    isVisible: false,
    position: null,
    suggestedText: '',
    triggerText: '',
    context: 'section',
    showDialog: false,
    suggestion: null,
  });
  const [summaryDialog, setSummaryDialog] = useState<SummaryDialogState>({
    isOpen: false,
    sourceSectionName: '',
    targetSectionName: '',
    sourceDocuments: [],
  });
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [editableSummary, setEditableSummary] = useState('');
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [localExtractedTexts, setLocalExtractedTexts] = useState<
    Record<string, string>
  >({});
  const pendingExtractionsRef = useRef<Set<string>>(new Set());
  const [highlightedParagraph, setHighlightedParagraph] = useState<
    string | null
  >(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [customFileName, setCustomFileName] = useState('');
  const [isSavingSummary, setIsSavingSummary] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [gapDialogOpen, setGapDialogOpen] = useState(false);
  const [isGapAnalyzing, setIsGapAnalyzing] = useState(false);
  const [gapResult, setGapResult] = useState<string | null>(null);
  const [gapError, setGapError] = useState<string | null>(null);
  const [fixDialogOpen, setFixDialogOpen] = useState(false);
  const [pendingFixText, setPendingFixText] = useState('');
  const gapErrorRef = useRef<string | null>(null);
  const summaryErrorRef = useRef<string | null>(null);
  const updateGapError = useCallback((value: string | null) => {
    gapErrorRef.current = value;
    setGapError(value);
  }, []);
  const updateSummaryError = useCallback((value: string | null) => {
    summaryErrorRef.current = value;
    setSummaryError(value);
  }, []);
  const sectionCode = useMemo(() => {
    return (
      extractSectionCodeHint(sectionId) ?? extractSectionCodeHint(sectionName)
    );
  }, [sectionId, sectionName]);
  const isSummarizeEnabled = useMemo(() => {
    const normalizedSource =
      sectionCode?.toLowerCase() ??
      extractSectionCodeHint(sectionName)?.toLowerCase() ??
      sectionName?.trim().toLowerCase() ??
      '';

    if (!normalizedSource) {
      return false;
    }

    return (
      normalizedSource.startsWith('2.4') || normalizedSource.startsWith('2.5')
    );
  }, [sectionCode, sectionName]);

  const extractPdfText = useCallback(async (pdfSource: string) => {
    if (!pdfSource || typeof window === 'undefined') {
      return null;
    }

    const cached = getCachedPdfText(pdfSource);
    if (cached && cached.trim().length > 0) {
      return cached;
    }

    if (pendingExtractionsRef.current.has(pdfSource)) {
      return null;
    }

    pendingExtractionsRef.current.add(pdfSource);
    try {
      const response = await fetch(pdfSource);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status}`);
      }

      const blob = await response.blob();
      const filename =
        pdfSource.split('/').pop()?.split('?')[0] ?? 'document.pdf';
      const file = new File([blob], filename, {
        type: blob.type || 'application/pdf',
      });

      const formData = new FormData();
      formData.append('file', file);

      const extractResponse = await fetch('/api/smart-editor/pdf-extract', {
        method: 'POST',
        body: formData,
      });

      if (!extractResponse.ok) {
        const errorText = await extractResponse.text();
        throw new Error(errorText || 'PDF extract failed');
      }

      const result = await extractResponse.json();
      const text = String(result?.text ?? '').trim();
      if (text.length > 0) {
        setCachedPdfText(pdfSource, text);
        return text;
      }
      return null;
    } catch (error) {
      console.error('PDF extract failed in editor:', error);
      return null;
    } finally {
      pendingExtractionsRef.current.delete(pdfSource);
    }
  }, []);

  useEffect(() => {
    if (!sectionDocuments || sectionDocuments.length === 0) {
      setLocalExtractedTexts({});
      return;
    }

    const allowedIds = new Set(sectionDocuments.map((doc) => doc.id));
    setLocalExtractedTexts((previous) => {
      let changed = false;
      const next: Record<string, string> = {};

      for (const [docId, text] of Object.entries(previous)) {
        if (allowedIds.has(docId)) {
          next[docId] = text;
        } else {
          changed = true;
        }
      }

      return changed ? next : previous;
    });
  }, [sectionDocuments]);

  useEffect(() => {
    if (!sectionDocuments || sectionDocuments.length === 0) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      const updates: Record<string, string> = {};

      await Promise.all(
        sectionDocuments.map(async (doc) => {
          if (cancelled) {
            return;
          }

          if (doc.extractedText && doc.extractedText.trim().length > 0) {
            updates[doc.id] = doc.extractedText;
            return;
          }

          if (localExtractedTexts[doc.id]) {
            return;
          }

          if (doc.pdfSource) {
            const cached = getCachedPdfText(doc.pdfSource);
            if (cached && cached.trim().length > 0) {
              updates[doc.id] = cached;
              return;
            }

            const extracted = await extractPdfText(doc.pdfSource);
            if (extracted && !cancelled) {
              updates[doc.id] = extracted;
            }
          }
        })
      );

      if (!cancelled && Object.keys(updates).length > 0) {
        setLocalExtractedTexts((prev) => ({ ...prev, ...updates }));
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [extractPdfText, localExtractedTexts, sectionDocuments]);

  const toParagraphDomId = useCallback((paragraphId: string) => {
    return `para-${paragraphId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  }, []);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Typography,
      CharacterCount,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Color.configure({ types: [TextStyle.name, 'listItem'] }),
      TextStyle,
      FontFamily.configure({
        types: [TextStyle.name],
      }),
      Placeholder.configure({
        placeholder,
      }),
      PdfEmbed,
      // Tiptap Pro AI Extension
      Ai.configure({
        appId: 'xm4rqwyk',
        token:
          '0ZqhnfE3PYx4asYX/s7vowBFP7qiEY5hUaetm8H/gRTaJyRD/yyQWByLitJtYixP',
      }),
      // Tiptap Pro Import Extension
      Import.configure({
        appId: 'xm4rqwyk',
        token:
          '0ZqhnfE3PYx4asYX/s7vowBFP7qiEY5hUaetm8H/gRTaJyRD/yyQWByLitJtYixP',
      }),
      // Tiptap Pro Export Extension
      Export.configure({
        appId: 'xm4rqwyk',
        token:
          '0ZqhnfE3PYx4asYX/s7vowBFP7qiEY5hUaetm8H/gRTaJyRD/yyQWByLitJtYixP',
      }),
    ],
    [placeholder]
  );

  const editor = useEditor({
    extensions,
    content: sanitizedContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none max-w-none',
      },
    },
    onUpdate({ editor }: { editor: Editor }) {
      const html = editor.getHTML();
      const json = editor.getJSON();

      // Update stats
      const characterCount = editor.storage.characterCount;
      const paragraphCount = (json.content ?? []).filter(
        (node: JSONContent) => node.type === 'paragraph'
      ).length;

      setStats({
        characters: characterCount.characters(),
        charactersNoSpaces: characterCount.characters({ mode: 'textSize' }),
        words: characterCount.words(),
        sentences: html.split(/[.!?]+/).length - 1,
        paragraphs: paragraphCount,
      });

      // Analyze text for suggestions
      const currentText = editor.getText();
      const cursorPos = editor.state.selection.from;
      analyzeTextForSuggestions(currentText, cursorPos);

      onContentChange?.(html);

      if (viewModeRef.current === 'html') {
        setScannedMarkup(html);
        setScannedMarkdown(convertHtmlToMarkdown(html));
      }
      if (viewModeRef.current === 'markdown') {
        setScannedMarkdown(convertHtmlToMarkdown(html));
      }
    },
  });

  useEffect(() => {
    setPdfEmbedHtml(resolvedInitialPdfEmbed);
  }, [resolvedInitialPdfEmbed]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextHtml = sanitizedContent || '';
    const currentHtml = editor.getHTML();

    if (
      normalizeHtmlForComparison(currentHtml) ===
      normalizeHtmlForComparison(nextHtml)
    ) {
      return;
    }

    editor.commands.setContent(nextHtml);
  }, [editor, sanitizedContent]);

  useEffect(() => {
    if (sanitizedContent) {
      setScannedMarkup(sanitizedContent);
      setScannedMarkdown(convertHtmlToMarkdown(sanitizedContent));
    } else {
      setScannedMarkup(null);
      setScannedMarkdown(null);
    }
  }, [sanitizedContent]);

  useEffect(() => {
    if (viewMode === 'pdf' && !pdfViewAttributes) {
      setViewMode('markdown');
      viewModeRef.current = 'markdown';
    }
  }, [pdfViewAttributes, viewMode]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !editor) return;

      setIsLoading(true);

      try {
        const fileNameLower = file.name.toLowerCase();
        const isPdf =
          file.type === MIME_TYPES.pdf ||
          fileNameLower.endsWith(FILE_EXTENSIONS.pdf);
        const isDocx =
          file.type === MIME_TYPES.wordProcessingMl ||
          fileNameLower.endsWith(FILE_EXTENSIONS.wordProcessingMl);
        const isPlainText =
          file.type === MIME_TYPES.plainText ||
          fileNameLower.endsWith(FILE_EXTENSIONS.plainText);
        const isHtml =
          file.type === MIME_TYPES.html ||
          fileNameLower.endsWith(FILE_EXTENSIONS.html);

        // Handle PDF files by embedding a viewer directly into the document
        if (isPdf) {
          const dataUrl = await fileToDataUrl(file);
          const inserted = editor.commands.setPdf({
            src: dataUrl,
            title: file.name,
            height: 720,
          });

          if (!inserted) {
            throw new Error('Unable to insert PDF viewer into the editor');
          }

          const { embedHtml } = extractPdfEmbedInfoFromHtml(editor.getHTML());
          setPdfEmbedHtml(normalizePdfEmbedHtml(embedHtml));
          setScannedMarkup(null);
          setScannedMarkdown(null);
          setViewMode('pdf');
          viewModeRef.current = 'pdf';
          setScanWarning(null);
          return;
        }

        // First try to use Tiptap Pro Import extension for DOCX files
        const editorCommands = editor.commands as Record<string, unknown>;
        const importCommand = getEditorCommand<ImportCommandFn>(
          editorCommands,
          'import'
        );

        if (importCommand && isDocx) {
          try {
            const arrayBuffer = await file.arrayBuffer();

            // Use Pro import extension for DOCX files
            await importCommand({
              file: arrayBuffer,
              format: 'docx',
              appId: 'xm4rqwyk',
              token:
                '0ZqhnfE3PYx4asYX/s7vowBFP7qiEY5hUaetm8H/gRTaJyRD/yyQWByLitJtYixP',
            });
            return;
          } catch (proError) {
            logger.warn(
              'Tiptap Pro import failed, falling back to mammoth:',
              proError
            );
          }
        }

        // Fallback to manual conversion
        if (isDocx) {
          // Handle DOCX files with mammoth
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          editor.commands.setContent(result.value);
        } else if (isPlainText) {
          // Handle text files
          const text = await file.text();
          editor.commands.setContent(
            `<p>${text.replace(/\n/g, '</p><p>')}</p>`
          );
        } else if (isHtml) {
          // Handle HTML files
          const html = await file.text();
          editor.commands.setContent(html);
        } else {
          // Unsupported file type
          return;
        }
      } catch (error) {
        logger.error('Error importing file:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [editor]
  );

  const exportAsDocx = useCallback(async () => {
    if (!editor) return;

    try {
      setIsLoading(true);

      // First try to use Tiptap Pro Export extension
      const editorCommands = editor.commands as Record<string, unknown>;
      const exportCommand = getEditorCommand<ExportCommandFn>(
        editorCommands,
        'export'
      );

      if (exportCommand) {
        try {
          // Use Pro export extension
          const result = await exportCommand({
            format: 'docx',
            appId: 'xm4rqwyk',
            token:
              '0ZqhnfE3PYx4asYX/s7vowBFP7qiEY5hUaetm8H/gRTaJyRD/yyQWByLitJtYixP',
          });

          if (result && result.blob) {
            // Create download link
            const url = URL.createObjectURL(result.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `document-${Date.now()}.docx`;
            a.click();
            URL.revokeObjectURL(url);

            onSave?.(editor.getHTML(), 'docx');
            return;
          }
        } catch (proError) {
          logger.warn(
            'Tiptap Pro export failed, falling back to manual conversion:',
            proError
          );
        }
      }

      // Fallback to manual DOCX generation
      // Convert editor content to plain text paragraphs for DOCX export
      const json = editor.getJSON();
      const paragraphs: Paragraph[] = [];

      const processContent = (content: JSONContent[]): void => {
        content.forEach((node) => {
          if (node.type === 'paragraph') {
            const textRuns: TextRun[] = [];

            (node.content ?? []).forEach((contentNode) => {
              if (
                contentNode.type === 'text' &&
                typeof contentNode.text === 'string'
              ) {
                const marks = Array.isArray(contentNode.marks)
                  ? (contentNode.marks as JsonMark[])
                  : [];

                textRuns.push(
                  new TextRun({
                    text: contentNode.text,
                    bold: marks.some((mark) => mark.type === 'bold'),
                    italics: marks.some((mark) => mark.type === 'italic'),
                  })
                );
              }
            });

            paragraphs.push(
              new Paragraph({
                children:
                  textRuns.length > 0 ? textRuns : [new TextRun({ text: '' })],
              })
            );
          } else if (node.type === 'heading') {
            const textRuns: TextRun[] = [];

            (node.content ?? []).forEach((contentNode) => {
              if (
                contentNode.type === 'text' &&
                typeof contentNode.text === 'string'
              ) {
                textRuns.push(
                  new TextRun({
                    text: contentNode.text,
                    bold: true,
                    size:
                      node.attrs?.level === 1
                        ? 32
                        : node.attrs?.level === 2
                        ? 28
                        : 24,
                  })
                );
              }
            });

            paragraphs.push(
              new Paragraph({
                children:
                  textRuns.length > 0 ? textRuns : [new TextRun({ text: '' })],
              })
            );
          }

          if (Array.isArray(node.content)) {
            processContent(node.content);
          }
        });
      };

      if (json.content) {
        processContent(json.content);
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([new Uint8Array(buffer)], {
        type: MIME_TYPES.wordProcessingMl,
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${Date.now()}.docx`;
      a.click();
      URL.revokeObjectURL(url);

      onSave?.(editor.getHTML(), 'docx');
    } catch (error) {
      logger.error('Error exporting document as DOCX:', error);
    } finally {
      setIsLoading(false);
    }
  }, [editor, onSave]);

  const exportAsHtml = useCallback(() => {
    if (!editor) return;

    const html = editor.getHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);

    onSave?.(html, 'html');
  }, [editor, onSave]);

  const insertTable = useCallback(() => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  const insertImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const editorHtml = editor?.getHTML();
  const editorText = editor?.getText();
  const fallbackHtml = editorHtml ?? content;

  const htmlToPlainText = useCallback((value: string) => {
    if (!value) return '';
    return value
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  const sourceDocs = useMemo(() => {
    const docsToUse =
      (sectionDocuments && sectionDocuments.length > 0
        ? sectionDocuments
        : [
            {
              id: 'current-document',
              title: sectionName ?? 'Current Document',
              type: 'Document',
              lastModified: '',
              sources: 1,
              starred: false,
              tags: [],
              content: fallbackHtml ?? '',
              extractedText: undefined,
            },
          ]) || [];

    return docsToUse.map((doc) => {
      let textCandidate = doc.extractedText ?? localExtractedTexts[doc.id];

      if (!textCandidate && doc.pdfSource) {
        const cached = getCachedPdfText(doc.pdfSource);
        if (cached) {
          textCandidate = cached;
        }
      }

      const plainText =
        textCandidate && textCandidate.trim().length > 0
          ? textCandidate
          : htmlToPlainText(doc.content ?? fallbackHtml ?? '');

      const paragraphs = plainText
        .split(/(?:\r?\n){2,}/)
        .map((paragraph) => paragraph.trim())
        .filter((paragraph) => paragraph.length > 0)
        .map((paragraph, index) => ({
          id: `${doc.id}-para-${index}`,
          text: paragraph,
          lowerText: paragraph.toLowerCase(),
        }));

      return {
        id: doc.id,
        title: doc.title || 'Untitled',
        type: doc.type || 'Document',
        text: plainText,
        awaitingExtraction: !!doc.pdfSource && paragraphs.length === 0,
        paragraphs,
      };
    });
  }, [
    fallbackHtml,
    htmlToPlainText,
    sectionDocuments,
    sectionName,
    localExtractedTexts,
    extractPdfText,
  ]);

  const hasSourceText = useMemo(
    () => sourceDocs.some((doc) => (doc.paragraphs?.length ?? 0) > 0),
    [sourceDocs]
  );

  const gapAnalysisGate = useMemo<GapAnalysisGateState>(() => {
    if (isGapAnalyzing) {
      return {
        ready: false,
        message: 'Gap analysis is already running.',
        status: 'info',
      };
    }

    if (isLoading) {
      return {
        ready: false,
        message:
          'Document is still loading. Gap analysis will be available once loading completes.',
        status: 'info',
      };
    }

    if (!sectionName && !sectionId) {
      return {
        ready: false,
        message: 'Select a section before running gap analysis.',
        status: 'error',
      };
    }

    if (!hasSourceText) {
      return {
        ready: false,
        message:
          'Gap analysis unlocks after the document contents finish loading.',
        status: 'info',
      };
    }

    return {
      ready: true,
      message: null,
      status: 'success',
    };
  }, [hasSourceText, isGapAnalyzing, isLoading, sectionId, sectionName]);

  const escapeHtml = useCallback((value: string) => {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }, []);

  const docLabels = useMemo(() => {
    const labels = new Map<string, string>();
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    sourceDocs.forEach((doc, index) => {
      const letter = alphabet[index % alphabet.length];
      const suffix =
        index >= alphabet.length
          ? `${Math.floor(index / alphabet.length) + 1}`
          : '';
      labels.set(doc.id, `${letter}${suffix}`);
    });
    return labels;
  }, [sourceDocs]);

  const saveConfig = useMemo(() => {
    const normalizedSource =
      (sectionCode ?? extractSectionCodeHint(sectionName))?.toLowerCase() ??
      sectionName?.trim().toLowerCase() ??
      '';

    if (normalizedSource.startsWith('2.4')) {
      return {
        dialogTitle: 'Save as 2.6 nonclinical summary',
        primaryFolder: '2.6',
        primaryFileName: '2.6 nonclinical summary.txt',
        secondaryFolder: '2.4',
        inputPlaceholder: 'Enter alternate file name for 2.4…',
      } as const;
    }
    if (normalizedSource.startsWith('2.5')) {
      return {
        dialogTitle: 'Save as 2.7 clinical summary',
        primaryFolder: '2.7',
        primaryFileName: '2.7 clinical summary.txt',
        secondaryFolder: '2.5',
        inputPlaceholder: 'Enter alternate file name for 2.5…',
      } as const;
    }
    const code = sectionCode ?? (normalizedSource || 'general');
    return {
      dialogTitle: 'Save summary',
      primaryFolder: code,
      primaryFileName: `${code}-summary.txt`,
      secondaryFolder: code,
      inputPlaceholder: 'Enter alternate file name…',
    } as const;
  }, [sectionCode, sectionName]);

  const paragraphMeta = useMemo(() => {
    const meta: Record<
      string,
      { docId: string; docTitle: string; docLabel: string; index: number }
    > = {};
    sourceDocs.forEach((doc, docIndex) => {
      const label = docLabels.get(doc.id) ?? `Doc${docIndex + 1}`;
      doc.paragraphs?.forEach((paragraph, index) => {
        meta[paragraph.id] = {
          docId: doc.id,
          docTitle: doc.title,
          docLabel: label,
          index,
        };
      });
    });
    return meta;
  }, [docLabels, sourceDocs]);

  const toggleFormat = useCallback(
    (format: string) => {
      if (!editor) return;

      switch (format) {
        case 'bold':
          editor.chain().focus().toggleBold().run();
          break;
        case 'italic':
          editor.chain().focus().toggleItalic().run();
          break;
        case 'underline':
          editor.chain().focus().toggleUnderline().run();
          break;
        case 'bulletList':
          editor.chain().focus().toggleBulletList().run();
          break;
        case 'orderedList':
          editor.chain().focus().toggleOrderedList().run();
          break;
        case 'blockquote':
          editor.chain().focus().toggleBlockquote().run();
          break;
        case 'code':
          editor.chain().focus().toggleCode().run();
          break;
      }
    },
    [editor]
  );

  const setAlignment = useCallback(
    (alignment: 'left' | 'center' | 'right') => {
      if (!editor) return;
      editor.chain().focus().setTextAlign(alignment).run();
    },
    [editor]
  );

  const triggerScanDocument = useCallback(async () => {
    if (!editor || isLoading) return;

    const html = editor.getHTML();
    const { embedHtml, src } = extractPdfEmbedInfoFromHtml(html);

    let resolvedSrc = src;
    let resolvedEmbedHtml = normalizePdfEmbedHtml(embedHtml);

    if (!resolvedSrc && pdfEmbedHtml) {
      const fallback = extractPdfEmbedInfoFromHtml(pdfEmbedHtml);
      resolvedSrc = fallback.src ?? resolvedSrc;
      resolvedEmbedHtml =
        normalizePdfEmbedHtml(fallback.embedHtml) ?? resolvedEmbedHtml;
    }

    if (!resolvedSrc && pdfSource) {
      resolvedSrc = pdfSource;
    }

    if (!resolvedSrc) {
      setScanError(
        'No embedded PDF found to scan. Upload a PDF first, then try again.'
      );
      return;
    }

    if (!resolvedEmbedHtml && pdfEmbedHtml) {
      resolvedEmbedHtml = normalizePdfEmbedHtml(pdfEmbedHtml);
    }

    if (!resolvedEmbedHtml && resolvedSrc) {
      resolvedEmbedHtml = createPdfEmbedHtml({
        src: resolvedSrc,
        title: documentTitle ?? undefined,
        height: DEFAULT_PDF_EMBED_HEIGHT,
      });
    }

    setPdfEmbedHtml(resolvedEmbedHtml);
    try {
      setIsLoading(true);
      setScanError(null);
      setScanWarning(null);

      const response = await fetch(resolvedSrc);
      if (!response.ok) {
        throw new Error(
          `Unable to fetch PDF for scanning (status ${response.status}).`
        );
      }

      const pdfBlob = await response.blob();
      const formData = new FormData();
      formData.append('file', pdfBlob, 'document.pdf');

      const scanResponse = await fetch('/api/smart-editor/pdf-extract', {
        method: 'POST',
        body: formData,
      });

      if (!scanResponse.ok) {
        const errorText = await scanResponse.text();
        throw new Error(
          errorText || `Failed to extract PDF (${scanResponse.status})`
        );
      }

      const result = (await scanResponse.json()) as PdfExtractResponse;
      if (!result.success) {
        throw new Error(result.error || 'PDF extraction failed.');
      }

      const pdfResult: PDFExtractionResult = {
        text: result.text ?? '',
        pages: result.pages ?? 0,
        metadata: {
          title: result.info?.Title || 'Scanned Document',
          author: result.info?.Author,
          subject: result.info?.Subject,
          creator: result.info?.Creator,
          producer: result.info?.Producer,
          creationDate: parsePdfDate(result.info?.CreationDate),
          modificationDate: parsePdfDate(result.info?.ModDate),
        },
      };

      const fallbackMarkup = convertPDFTextToHTML(pdfResult);
      const markupContent =
        result.html && result.html.trim().length > 0
          ? result.html
          : fallbackMarkup;

      setPdfEmbedHtml(resolvedEmbedHtml);
      setScanWarning(result.warning ?? null);

      if (markupContent && markupContent.trim().length > 0) {
        const markdown = convertHtmlToMarkdown(markupContent);
        setScannedMarkup(markupContent);
        setScannedMarkdown(markdown);
        setViewMode('markdown');
        viewModeRef.current = 'markdown';
        editor.commands.setContent(renderMarkdownAsHtml(markdown));
      } else {
        setScannedMarkup(null);
        setScannedMarkdown(null);
        setViewMode('pdf');
        viewModeRef.current = 'pdf';
        if (resolvedEmbedHtml) {
          editor.commands.setContent(resolvedEmbedHtml);
        }
      }

      setIsEditing(true);
    } catch (error) {
      setScanError(
        error instanceof Error
          ? error.message
          : 'Failed to scan the PDF into markup.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    convertPDFTextToHTML,
    documentTitle,
    editor,
    isLoading,
    pdfEmbedHtml,
    pdfSource,
  ]);

  const handleReferenceClick = useCallback(
    (paragraphId: string) => {
      setHighlightedParagraph(paragraphId);
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }

      const domId = toParagraphDomId(paragraphId);
      const element = document.getElementById(domId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedParagraph(null);
        highlightTimeoutRef.current = null;
      }, 4000);
    },
    [toParagraphDomId]
  );

  const renderSummaryPreview = useCallback(
    (text: string) => {
      const blocks = text
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean);
      const REF_REGEX = /\[ref:([^\]]+)\]/g;

      const renderLine = (line: string, keyPrefix: string) => {
        const elements: React.ReactNode[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = REF_REGEX.exec(line)) !== null) {
          const raw = match[1];
          const ids = raw
            .split(/[,;\s]+/)
            .map((id) => id.trim())
            .filter(Boolean);

          if (match.index > lastIndex) {
            elements.push(line.slice(lastIndex, match.index));
          }

          if (ids.length === 0) {
            elements.push(match[0]);
          } else {
            elements.push(
              <span
                key={`${keyPrefix}-ref-${match.index}`}
                className='inline-flex gap-1'
              >
                {ids.map((id) => {
                  const meta = paragraphMeta[id];
                  const label = meta
                    ? `${meta.docLabel}§${meta.index + 1}`
                    : id;
                  const isActive = highlightedParagraph === id;
                  return (
                    <button
                      key={`${keyPrefix}-${id}`}
                      type='button'
                      className={`rounded border px-2 py-0.5 text-xs font-medium transition-colors ${
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                      onClick={() => handleReferenceClick(id)}
                    >
                      {label}
                    </button>
                  );
                })}
              </span>
            );
          }

          lastIndex = match.index + match[0].length;
        }

        if (lastIndex < line.length) {
          elements.push(line.slice(lastIndex));
        }

        return <span key={keyPrefix}>{elements}</span>;
      };

      return blocks.map((block, blockIndex) => {
        const lines = block.split('\n');
        return (
          <div key={`summary-block-${blockIndex}`} className='space-y-1'>
            {lines.map((line, lineIndex) => (
              <p
                key={`summary-block-${blockIndex}-line-${lineIndex}`}
                className='text-sm leading-relaxed whitespace-pre-wrap'
              >
                {renderLine(line, `block-${blockIndex}-line-${lineIndex}`)}
              </p>
            ))}
          </div>
        );
      });
    },
    [handleReferenceClick, paragraphMeta, highlightedParagraph]
  );

  const renderGapResult = useCallback((text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        elements.push(<div key={`gap-empty-${index}`} className='h-2' />);
        return;
      }

      const headingMatch = trimmed.match(/^####\s*(.+)$/);
      if (headingMatch) {
        elements.push(
          <h4
            key={`gap-heading-${index}`}
            className='text-red-600 font-bold text-sm leading-relaxed tracking-wide uppercase'
          >
            {headingMatch[1]}
          </h4>
        );
        return;
      }

      const actionMatch = trimmed.match(
        /(action|recommendation|suggested remedy)\s*:?(.*)/i
      );

      if (/^[-*]\s+/.test(trimmed)) {
        const textWithoutBullet = trimmed.replace(/^[-*]\s+/, '').trim();
        elements.push(
          <div
            key={`gap-bullet-${index}`}
            className='pl-4 text-sm leading-relaxed text-muted-foreground flex items-start gap-2'
          >
            <span className='mt-1'>•</span>
            <span className='flex-1'>{textWithoutBullet}</span>
            {actionMatch && actionMatch[2]?.trim() && (
              <Button
                variant='outline'
                size='sm'
                className='ml-2 text-xs'
                onClick={() => {
                  setPendingFixText(actionMatch[2].trim());
                  setFixDialogOpen(true);
                }}
              >
                Fix it
              </Button>
            )}
          </div>
        );
        return;
      }

      if (/^\d+\./.test(trimmed)) {
        elements.push(
          <p
            key={`gap-number-${index}`}
            className='pl-4 text-sm leading-relaxed text-muted-foreground'
          >
            {trimmed}
          </p>
        );
        return;
      }

      elements.push(
        <div
          key={`gap-text-${index}`}
          className='text-sm leading-relaxed text-muted-foreground flex items-start gap-2'
        >
          <span className='flex-1'>{trimmed}</span>
          {actionMatch && actionMatch[2]?.trim() && (
            <Button
              variant='outline'
              size='sm'
              className='ml-2 text-xs'
              onClick={() => {
                setPendingFixText(actionMatch[2].trim());
                setFixDialogOpen(true);
              }}
            >
              Fix it
            </Button>
          )}
        </div>
      );
    });

    return elements;
  }, []);

  const handleFixInsert = useCallback(() => {
    if (!editor || !pendingFixText.trim()) {
      return;
    }

    const sanitized = escapeHtml(pendingFixText.trim());
    editor
      .chain()
      .focus()
      .insertContent(
        `<div class="border border-amber-400 bg-amber-50 text-amber-900 px-3 py-2 rounded-md my-2">${sanitized}</div>`
      )
      .run();

    setFixDialogOpen(false);
    setPendingFixText('');
  }, [editor, escapeHtml, pendingFixText]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
      }
    };
  }, []);

  const saveSummaryToFolder = useCallback(
    async (folder: string, fileName: string) => {
      setIsSavingSummary(true);
      setSaveFeedback(null);
      try {
        const response = await fetch('/api/smart-editor/save-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: editableSummary,
            folder,
            fileName,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || 'Failed to save summary.');
        }

        const payload = (await response.json()) as { path?: string };
        setSaveFeedback({
          type: 'success',
          message: payload?.path
            ? `Saved to ${payload.path}`
            : 'Summary saved successfully.',
        });
        setSaveDialogOpen(false);
        setCustomFileName('');
        setHighlightedParagraph(null);
      } catch (error) {
        setSaveFeedback({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Unexpected error while saving summary.',
        });
      } finally {
        setIsSavingSummary(false);
      }
    },
    [editableSummary]
  );

  const openSaveDialog = useCallback(() => {
    setSaveFeedback(null);
    setCustomFileName('');
    setSaveDialogOpen(true);
  }, []);

  const handlePrimarySave = useCallback(async () => {
    if (!editableSummary.trim()) {
      setSaveFeedback({ type: 'error', message: 'Summary is empty.' });
      return;
    }
    await saveSummaryToFolder(
      saveConfig.primaryFolder,
      saveConfig.primaryFileName
    );
  }, [editableSummary, saveConfig, saveSummaryToFolder]);

  const handleSecondarySave = useCallback(async () => {
    if (!editableSummary.trim()) {
      setSaveFeedback({ type: 'error', message: 'Summary is empty.' });
      return;
    }
    if (!customFileName.trim()) {
      setSaveFeedback({ type: 'error', message: 'Please enter a file name.' });
      return;
    }
    await saveSummaryToFolder(saveConfig.secondaryFolder, customFileName);
  }, [customFileName, editableSummary, saveConfig, saveSummaryToFolder]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
      }
    };
  }, []);

  const triggerGapAnalysis = useCallback(async (): Promise<string | null> => {
    if (!gapAnalysisGate.ready) {
      if (gapAnalysisGate.message) {
        updateGapError(gapAnalysisGate.message);
        setGapDialogOpen(true);
      }
      return null;
    }

    updateGapError(null);
    setGapResult(null);
    setSummaryResult(null);
    setEditableSummary('');
    setGapDialogOpen(true);
    setIsGapAnalyzing(true);

    // if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    //   // Allow the dialog to render first, but fall back if frames are throttled (e.g. background tabs).
    //   await new Promise<void>((resolve) => {
    //     let settled = false;
    //     const timeoutId = window.setTimeout(() => {
    //       if (!settled) {
    //         settled = true;
    //         resolve();
    //       }
    //     }, 100);

    //     window.requestAnimationFrame(() => {
    //       window.requestAnimationFrame(() => {
    //         if (!settled) {
    //           settled = true;
    //           window.clearTimeout(timeoutId);
    //           resolve();
    //         }
    //       });
    //     });
    //   });
    // } else {
    //   await new Promise<void>((resolve) => {
    //     setTimeout(resolve, 0);
    //   });
    // }

    let result: string | null = null;

    try {
      const payload = {
        sectionName,
        sectionCode,
        sectionId,
        documents: sourceDocs.map((doc) => ({
          id: doc.id,
          title: doc.title,
          content: doc.text ?? doc.content ?? '',
        })),
      };

      const response = await fetch('/api/smart-editor/gap-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details?.error || 'Gap analysis failed');
      }

      const data = (await response.json()) as { result?: string };
      if (!data?.result) {
        throw new Error('Gap analysis returned no findings.');
      }

      result = data.result;
      setGapResult(result);
      updateGapError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unexpected error during gap analysis.';
      updateGapError(message);
      setGapDialogOpen(true);
      result = null;
    } finally {
      setIsGapAnalyzing(false);
    }

    return result;
  }, [
    gapAnalysisGate,
    sectionCode,
    sectionId,
    sectionName,
    sourceDocs,
    updateGapError,
  ]);

  const determineSummaryTarget = useCallback(
    (name?: string | null) => {
      const normalized =
        sectionCode?.toLowerCase() ??
        extractSectionCodeHint(name)?.toLowerCase() ??
        name?.trim().toLowerCase() ??
        '';

      if (normalized.startsWith('2.4')) {
        return '2.6 nonclinical summaries';
      }

      if (normalized.startsWith('2.5')) {
        return '2.7 clinical summaries';
      }

      return 'Summary Workspace';
    },
    [sectionCode]
  );

  const triggerAISummarize = useCallback(() => {
    if (!isSummarizeEnabled) {
      return;
    }

    const sourceName = sectionName?.trim() || 'Current Section';
    const targetName = determineSummaryTarget(sectionName);

    const mappedSources = (sectionDocuments ?? []).map((doc) => ({
      id: doc.id,
      title: doc.title,
      type: doc.type,
    }));

    // Ensure at least the active document is listed when no section context is provided
    const sourcesToDisplay = mappedSources.length
      ? mappedSources
      : [
          {
            id: 'current-document',
            title: sourceName,
            type: 'Document',
          },
        ];

    updateSummaryError(null);
    setSummaryDialog({
      isOpen: true,
      sourceSectionName: sourceName,
      targetSectionName: targetName,
      sourceDocuments: sourcesToDisplay,
    });
  }, [determineSummaryTarget, isSummarizeEnabled, sectionName, sourceDocs]);

  const handleGenerateSummary = useCallback(async (): Promise<
    string | null
  > => {
    if (!isSummarizeEnabled) {
      updateSummaryError(
        'Summary generation is only available for sections 2.4 and 2.5.'
      );
      return null;
    }

    setSummaryDialog((prev) => ({ ...prev, isOpen: false }));
    setIsSummarizing(true);
    updateSummaryError(null);
    setSummaryResult(null);
    setEditableSummary('');
    setGapResult(null);
    updateGapError(null);
    setHighlightedParagraph(null);

    let result: string | null = null;

    try {
      const payload = {
        sectionName,
        documents: sourceDocs.map((doc) => ({
          id: doc.id,
          title: doc.title,
          paragraphs: doc.paragraphs?.map((paragraph) => ({
            id: paragraph.id,
            text:
              paragraph.text.length > 2000
                ? `${paragraph.text.slice(0, 2000)}…`
                : paragraph.text,
          })),
          content: doc.text,
        })),
      };

      const response = await fetch('/api/smart-editor/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        const message =
          typeof errorPayload?.error === 'string'
            ? errorPayload.error
            : 'Unable to generate summary.';
        updateSummaryError(message);
        return null;
      }

      const data = await response.json();
      if (!data?.summary || typeof data.summary !== 'string') {
        updateSummaryError('Summary response was empty.');
        return null;
      }

      const summaryText = data.summary.trim();
      result = summaryText;
      setSummaryResult(summaryText);
      setEditableSummary(summaryText);
      updateSummaryError(null);
    } catch (error) {
      logger.error('Summary generation failed:', error);
      updateSummaryError(
        error instanceof Error
          ? error.message
          : 'Unexpected error during summarization.'
      );
      result = null;
    } finally {
      setIsSummarizing(false);
    }

    return result;
  }, [
    isSummarizeEnabled,
    logger,
    sectionName,
    sourceDocs,
    updateGapError,
    updateSummaryError,
  ]);

  const runGapAnalysisCommand =
    useCallback(async (): Promise<AssistantCommandResult> => {
      if (!gapAnalysisGate.ready) {
        const message =
          gapAnalysisGate.message ??
          'Gap analysis is temporarily unavailable. Try again shortly.';
        const status =
          gapAnalysisGate.status === 'error'
            ? ('error' as const)
            : ('info' as const);
        return {
          status,
          message,
        };
      }

      const handledResult = await triggerGapAnalysis();
      const safeSection = sectionName ?? 'the current section';

      if (handledResult && handledResult.trim().length > 0) {
        return {
          status: 'success',
          message: `Gap analysis completed for ${safeSection}.`,
          content: handledResult,
        };
      }

      const fallback =
        gapErrorRef.current ?? 'Gap analysis did not return any findings.';
      return {
        status: gapErrorRef.current ? 'error' : 'info',
        message: fallback,
      };
    }, [gapAnalysisGate, sectionName, triggerGapAnalysis]);

  const runSummaryCommand = useCallback(
    async (
      options?: AssistantCommandOptions
    ): Promise<AssistantCommandResult> => {
      const sectionHint = options?.sectionHint?.toLowerCase();
      if (
        sectionHint &&
        sectionName &&
        !sectionName.toLowerCase().includes(sectionHint)
      ) {
        return {
          status: 'info',
          message: `You're currently in ${sectionName}. Switch to a section matching "${options?.sectionHint}" and try again.`,
        };
      }

      const summaryText = await handleGenerateSummary();
      const safeSection = sectionName ?? 'this section';

      if (summaryText && summaryText.trim().length > 0) {
        return {
          status: 'success',
          message: `Summary generated for ${safeSection}.`,
          content: summaryText,
        };
      }

      const fallback =
        summaryErrorRef.current ??
        'Summary generation did not produce any content. Review the summary panel for more details.';
      return {
        status: summaryErrorRef.current ? 'error' : 'info',
        message: fallback,
      };
    },
    [handleGenerateSummary, sectionName]
  );

  const listAssistantHints = useCallback((): AssistantCommandHint[] => {
    const hints: AssistantCommandHint[] = [
      {
        command: 'gap analyze',
        description: 'Run a compliance gap review on the active section.',
      },
    ];

    const code = sectionCode ?? 'current section';
    const summaryCommand = sectionCode ? `summary ${code}` : 'summary';

    if (isSummarizeEnabled) {
      hints.push({
        command: summaryCommand,
        description: `Generate a summary draft for ${sectionName ?? code}.`,
      });
    }

    hints.push({
      command: 'help',
      description: 'Show available assistant commands.',
    });

    return hints;
  }, [isSummarizeEnabled, sectionCode, sectionName]);

  const getAssistantContext = useCallback(() => {
    return {
      sectionName,
      documentTitle,
    };
  }, [documentTitle, sectionName]);

  // Custom button functions
  const insertCurrentDate = useCallback(() => {
    if (!editor) return;
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    editor.chain().focus().insertContent(`${currentDate}`).run();
  }, [editor]);

  const insertHeader = useCallback(
    (level: 1 | 2 | 3) => {
      if (!editor) return;
      editor.chain().focus().toggleHeading({ level }).run();
    },
    [editor]
  );

  const insertDivider = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().setHorizontalRule().run();
  }, [editor]);

  const insertTemplate = useCallback(() => {
    if (!editor) return;
    const template = `
<h2>📋 Meeting Notes</h2>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Attendees:</strong> </p>
<p><strong>Agenda:</strong></p>
<ul>
  <li></li>
  <li></li>
  <li></li>
</ul>
<p><strong>Action Items:</strong></p>
<ul>
  <li></li>
  <li></li>
</ul>
<p><strong>Next Steps:</strong></p>
<p></p>
    `;
    editor.chain().focus().insertContent(template).run();
  }, [editor]);

  const highlightText = useCallback(() => {
    if (!editor) return;
    // Toggle highlight by adding background color
    const isHighlighted = editor.isActive('textStyle', {
      backgroundColor: '#ffeb3b',
    });
    if (isHighlighted) {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor('#ffeb3b').run();
    }
  }, [editor]);

  const insertCommentBox = useCallback(() => {
    if (!editor) return;
    const commentHTML = `
<blockquote style="border-left: 4px solid #e3f2fd; background-color: #f5f5f5; padding: 12px; margin: 16px 0; border-radius: 4px;">
  <p style="margin: 0; font-style: italic; color: #666;">💬 <strong>Comment:</strong> Add your comment here...</p>
</blockquote>
    `;
    editor.chain().focus().insertContent(commentHTML).run();
  }, [editor]);

  // Suggestion system functions
  const generateSuggestion = useCallback(
    (
      triggerText: string,
      context: 'section' | 'topic' | 'continuation'
    ): SmartSuggestion => {
      const suggestions = {
        section: {
          '1.': 'Introduction\n\nThis section provides an overview of the main concepts and objectives that will be covered in this document.',
          '2.': 'Background\n\nThis section outlines the context and foundational information necessary to understand the subject matter.',
          '3.': 'Methodology\n\nThis section describes the approach, methods, and procedures used in the analysis or implementation.',
          '4.': 'Results\n\nThis section presents the findings, outcomes, and key data derived from the methodology.',
          '5.': 'Discussion\n\nThis section analyzes and interprets the results, exploring their implications and significance.',
          '6.': 'Conclusion\n\nThis section summarizes the key findings and their broader implications, providing final thoughts and recommendations.',
          '1.1':
            'Overview\n\nThis subsection provides a detailed introduction to the main topic and its significance.',
          '1.2':
            'Scope\n\nThis subsection defines the boundaries and limitations of the current analysis or discussion.',
          '2.1':
            'Literature Review\n\nThis subsection examines existing research and knowledge related to the topic.',
          '2.2':
            'Historical Context\n\nThis subsection provides the historical background and evolution of the subject matter.',
        } as Record<string, string>,
        topic: {
          meeting:
            'Meeting Agenda\n\n**Date:** [Date]\n**Time:** [Time]\n**Location:** [Location/Virtual]\n\n**Agenda Items:**\n1. Welcome and introductions\n2. Review of previous action items\n3. Main discussion topics\n4. Next steps and action items\n5. Closing remarks',
          project:
            'Project Overview\n\n**Project Name:** [Project Name]\n**Duration:** [Timeline]\n**Team Members:** [List team members]\n\n**Objectives:**\n- [Objective 1]\n- [Objective 2]\n- [Objective 3]\n\n**Key Deliverables:**\n- [Deliverable 1]\n- [Deliverable 2]',
          report:
            'Report Structure\n\n**Executive Summary**\n[Brief overview of key findings]\n\n**Introduction**\n[Background and purpose]\n\n**Main Findings**\n[Detailed analysis and results]\n\n**Recommendations**\n[Actionable next steps]\n\n**Conclusion**\n[Summary and final thoughts]',
          analysis:
            'Analysis Framework\n\n**Problem Statement**\n[Define the issue or question]\n\n**Data Sources**\n[List relevant data and information]\n\n**Methodology**\n[Describe analytical approach]\n\n**Findings**\n[Key insights and patterns]\n\n**Implications**\n[What the findings mean]',
        } as Record<string, string>,
        continuation: {
          furthermore:
            'Furthermore, it is important to consider the additional factors that may influence the outcome.',
          however:
            'However, there are several limitations that should be taken into account when interpreting these results.',
          therefore:
            'Therefore, based on the evidence presented, it can be concluded that...',
          additionally:
            'Additionally, further research is needed to fully understand the implications of these findings.',
          meanwhile:
            'Meanwhile, other developments in the field suggest that alternative approaches may be worth exploring.',
        } as Record<string, string>,
      };

      const contextSuggestions = suggestions[context];
      let suggestedText =
        'Here is a suggested continuation for your content. Click Insert to add this text to your document.';
      let contextDescription =
        'I detected you might need help with your writing.';

      // Check for exact matches first
      if (contextSuggestions[triggerText]) {
        suggestedText = contextSuggestions[triggerText];
      } else if (context === 'topic') {
        // Check for partial matches in topic context
        const lowerTrigger = triggerText.toLowerCase();
        for (const [key, value] of Object.entries(contextSuggestions)) {
          if (lowerTrigger.includes(key) || key.includes(lowerTrigger)) {
            suggestedText = value;
            break;
          }
        }
      }

      // Set context description based on type
      if (context === 'section') {
        contextDescription = `I detected you're starting section "${triggerText}". Here's a structured template:`;
      } else if (context === 'topic') {
        contextDescription = `I detected content related to "${triggerText}". Here's a helpful template:`;
      } else {
        contextDescription = `I detected you might want to continue with "${triggerText}". Here's a suggestion:`;
      }

      return {
        text: suggestedText,
        context: contextDescription,
        type: context,
        category: 'Legacy Template', // Temporary category for existing logic
      };
    },
    []
  );

  const showSuggestionBulb = useCallback(
    (suggestion: {
      triggerText: string;
      suggestedText: string;
      context: 'section' | 'topic' | 'continuation' | 'structure';
    }) => {
      if (!editor) return;

      // Get cursor position
      const { view } = editor;
      const { from } = view.state.selection;
      const coords = view.coordsAtPos(from);

      if (coords) {
        const editorElement = view.dom as HTMLElement;
        const editorRect = editorElement.getBoundingClientRect();
        const bulbLeft = Math.max(editorRect.left - 56, 16);
        const generatedSuggestion = generateSuggestion(
          suggestion.triggerText,
          suggestion.context as 'section' | 'topic' | 'continuation'
        );
        setSuggestionState({
          isVisible: true,
          position: {
            top: coords.top,
            left: bulbLeft,
          },
          suggestedText: suggestion.suggestedText,
          triggerText: suggestion.triggerText,
          context: suggestion.context,
          showDialog: false,
          suggestion: generatedSuggestion,
        });
      }
    },
    [editor, generateSuggestion, setSuggestionState]
  );

  const analyzeTextForSuggestions = useCallback(
    (text: string, cursorPosition: number) => {
      if (!editor) return;

      // Get the current line or last few words
      const beforeCursor = text.substring(0, cursorPosition);
      const lines = beforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      const words = currentLine.trim().split(/\s+/);
      const lastWords = words.slice(-3).join(' ').toLowerCase();

      // Section number detection (e.g., "1.", "2.1", "3.2.1")
      const sectionPattern = /(\d+\.(\d+\.)*)\s*$/;
      const sectionMatch = currentLine.match(sectionPattern);

      if (sectionMatch) {
        const sectionNum = sectionMatch[1];
        const matchedPattern = findSuggestionPattern(text, currentLine);

        if (matchedPattern) {
          // Create a legacy-style suggestion for compatibility
          const suggestionData = {
            triggerText: sectionNum,
            suggestedText: matchedPattern.content,
            context: matchedPattern.type as
              | 'section'
              | 'topic'
              | 'continuation',
          };
          showSuggestionBulb(suggestionData);
          return suggestionData;
        }
      }

      // Topic-related keywords
      const topicKeywords = [
        'meeting',
        'project',
        'report',
        'analysis',
        'summary',
        'overview',
        'introduction',
        'conclusion',
      ];
      for (const keyword of topicKeywords) {
        if (lastWords.includes(keyword)) {
          const suggestion = generateSuggestion(keyword, 'topic');
          const suggestionData = {
            triggerText: keyword,
            suggestedText: suggestion.text,
            context: 'topic' as const,
          };
          showSuggestionBulb(suggestionData);
          return suggestionData;
        }
      }

      // Continuation words
      const continuationWords = [
        'furthermore',
        'however',
        'therefore',
        'additionally',
        'meanwhile',
      ];
      for (const word of continuationWords) {
        if (lastWords.endsWith(word)) {
          const suggestion = generateSuggestion(word, 'continuation');
          const suggestionData = {
            triggerText: word,
            suggestedText: suggestion.text,
            context: 'continuation' as const,
          };
          showSuggestionBulb(suggestionData);
          return suggestionData;
        }
      }

      // Hide suggestion if no triggers found
      setSuggestionState((prev) => ({ ...prev, isVisible: false }));
      return null;
    },
    [editor, generateSuggestion, showSuggestionBulb, setSuggestionState]
  );

  // Extract key topics from document using OpenAI
  const extractTopics = useCallback(async () => {
    if (!editor) return;

    const content = editor.getText();
    if (!content.trim() || content.length < 50) {
      setTopicState((prev: TopicExtractionState) => ({
        ...prev,
        topics: [],
        error: null,
      }));
      return;
    }

    setTopicState((prev: TopicExtractionState) => ({
      ...prev,
      isExtracting: true,
      error: null,
    }));

    try {
      const response = await fetch('/api/smart-editor/extract-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.substring(0, 8000), // Limit content length for API
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setTopicState((prev: TopicExtractionState) => ({
        ...prev,
        topics: data.topics || [],
        isExtracting: false,
        error: null,
      }));

      // Reset the show all topics state when new topics are extracted
      setShowAllTopics(false);
    } catch (error) {
      setTopicState((prev: TopicExtractionState) => ({
        ...prev,
        isExtracting: false,
        error:
          error instanceof Error ? error.message : 'Failed to extract topics',
        topics: [],
      }));
    }
  }, [editor]);

  // Navigate to topic location in document
  const navigateToTopic = useCallback(
    (topic: DocumentTopic) => {
      if (!topic.searchText?.trim()) {
        return;
      }

      const query = topic.searchText.toLowerCase();

      if (summaryResult) {
        for (const doc of sourceDocs) {
          const match = doc.paragraphs?.find((paragraph) =>
            paragraph.lowerText.includes(query)
          );
          if (match) {
            handleReferenceClick(match.id);
            return;
          }
        }
      }

      if (!editor) {
        return;
      }

      const content = editor.getText();
      const contentLower = content.toLowerCase();
      const index = contentLower.indexOf(query);

      if (index === -1) {
        return;
      }

      editor.commands.focus();
      editor.commands.setTextSelection({
        from: index + 1,
        to: index + topic.searchText.length + 1,
      });

      const selection = editor.view.state.selection;
      const coords = editor.view.coordsAtPos(selection.from);
      if (coords) {
        window.scrollTo({
          top: coords.top - 100,
          behavior: 'smooth',
        });
      }
    },
    [editor, handleReferenceClick, sourceDocs, summaryResult]
  );

  useEffect(() => {
    const handler = () => {
      if (hasSourceText && !summaryResult && !topicState.isExtracting) {
        void extractTopics();
      }
    };

    window.addEventListener('manual-topic-extract', handler);
    return () => window.removeEventListener('manual-topic-extract', handler);
  }, [extractTopics, hasSourceText, summaryResult, topicState.isExtracting]);

  // Trigger topic extraction when content changes
  useEffect(() => {
    if (
      !editor ||
      !editorText?.trim() ||
      summaryResult ||
      gapResult ||
      !hasSourceText
    ) {
      setTopicState((prev: TopicExtractionState) => ({
        ...prev,
        topics: [],
        error: null,
      }));
      return;
    }

    // Debounce topic extraction to avoid too many API calls
    const timeoutId = setTimeout(() => {
      extractTopics();
    }, 2000); // Wait 2 seconds after content stops changing

    return () => clearTimeout(timeoutId);
  }, [
    editor,
    editorText,
    extractTopics,
    summaryResult,
    gapResult,
    hasSourceText,
  ]);

  // Handle screen size detection
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 640);
    };

    // Set initial value
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Export function for external use (Word Import Dialog)
  interface PdfExtractResponse {
    success: boolean;
    text?: string;
    html?: string;
    pages?: number;
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
    warning?: string;
  }

  const importWordFile = useCallback(
    async (file: File): Promise<string> => {
      if (!editor) throw new Error('Editor not initialized');

      setIsLoading(true);

      try {
        const fileNameLower = file.name.toLowerCase();
        const isPdf =
          file.type === MIME_TYPES.pdf ||
          fileNameLower.endsWith(FILE_EXTENSIONS.pdf);
        const isDocx =
          file.type === MIME_TYPES.wordProcessingMl ||
          fileNameLower.endsWith(FILE_EXTENSIONS.wordProcessingMl);

        // Handle PDF files by embedding a viewer and extracted text
        if (isPdf) {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/smart-editor/pdf-extract', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              errorText || `Failed to extract PDF (${response.status})`
            );
          }

          const result = (await response.json()) as PdfExtractResponse;

          if (!result.success) {
            throw new Error(result.error || 'PDF extraction failed');
          }

          const pdfDataUrl = result.dataUrl || (await fileToDataUrl(file));

          const pdfResult: PDFExtractionResult = {
            text: result.text ?? '',
            pages: result.pages ?? 0,
            metadata: {
              title:
                result.info?.Title ||
                file.name.replace(
                  new RegExp(`${FILE_EXTENSIONS.pdf}$`, 'i'),
                  ''
                ),
              author: result.info?.Author,
              subject: result.info?.Subject,
              creator: result.info?.Creator,
              producer: result.info?.Producer,
              creationDate: parsePdfDate(result.info?.CreationDate),
              modificationDate: parsePdfDate(result.info?.ModDate),
            },
          };

          const htmlContent = convertPDFTextToHTML(pdfResult);
          const pdfEmbedHtml = createPdfEmbedHtml({
            src: pdfDataUrl,
            title: file.name,
            height: 720,
          });
          const markupContent =
            result.html && result.html.trim().length > 0
              ? result.html
              : htmlContent;
          const markdownContent = convertHtmlToMarkdown(markupContent);
          setPdfEmbedHtml(normalizePdfEmbedHtml(pdfEmbedHtml));
          setScannedMarkup(markupContent);
          setScannedMarkdown(markdownContent);
          setViewMode('markdown');
          viewModeRef.current = 'markdown';
          setScanWarning(result.warning ?? null);
          editor.commands.setContent(renderMarkdownAsHtml(markdownContent));
          return markupContent;
        }

        // First try to use Tiptap Pro Import extension for DOCX files
        const editorCommands = editor.commands as Record<string, unknown>;
        const importCommand = getEditorCommand<ImportCommandFn>(
          editorCommands,
          'import'
        );

        if (importCommand && isDocx) {
          try {
            const arrayBuffer = await file.arrayBuffer();

            // Use Pro import extension for DOCX files
            await importCommand({
              file: arrayBuffer,
              format: 'docx',
              appId: 'xm4rqwyk',
              token:
                '0ZqhnfE3PYx4asYX/s7vowBFP7qiEY5hUaetm8H/gRTaJyRD/yyQWByLitJtYixP',
            });

            return editor.getHTML();
          } catch (proError) {
            logger.warn(
              'Tiptap Pro import failed during external import:',
              proError
            );
          }
        }

        // Fallback to manual conversion
        if (isDocx) {
          // Handle DOCX files with mammoth
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          const markdown = convertHtmlToMarkdown(result.value);
          setPdfEmbedHtml(null);
          setScannedMarkup(result.value);
          setScannedMarkdown(markdown);
          setViewMode('markdown');
          viewModeRef.current = 'markdown';
          setScanWarning(null);
          editor.commands.setContent(renderMarkdownAsHtml(markdown));
          return result.value;
        }

        throw new Error(
          `Unsupported file format. Please use ${FILE_EXTENSIONS.wordProcessingMl.toUpperCase()} or ${FILE_EXTENSIONS.pdf.toUpperCase()} files.`
        );
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [editor]
  );

  // Wrapper function to match the expected interface
  const importWordFileWrapper = useCallback(
    async (file: File): Promise<void> => {
      await importWordFile(file);
    },
    [importWordFile]
  );

  // Expose import function to parent component
  useEffect(() => {
    // Only expose after editor and function are ready
    if (onEditorReady && editor) {
      // Use timeout to ensure all hooks are initialized
      const timer = setTimeout(() => {
        onEditorReady({
          importWordFile: importWordFileWrapper,
          exportAsDocx,
          exportAsHtml,
          assistant: {
            runGapAnalysis: runGapAnalysisCommand,
            runSummary: runSummaryCommand,
            listHints: listAssistantHints,
            getContext: getAssistantContext,
          },
        });
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [
    onEditorReady,
    importWordFileWrapper,
    editor,
    exportAsDocx,
    exportAsHtml,
    runGapAnalysisCommand,
    runSummaryCommand,
    listAssistantHints,
    getAssistantContext,
  ]);

  if (!editor) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Editor Header */}
      <div className='border-b border-border bg-card px-6 py-4'>
        <div className='flex items-center justify-between gap-4 min-w-0'>
          <div className='flex items-center gap-4 min-w-0 flex-1'>
            <div className='flex items-center bg-muted border border-border rounded-lg p-1 flex-shrink-0'>
              <Button
                variant={!isEditing ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setIsEditing(false)}
                className='h-8 px-3 text-sm font-medium'
              >
                <Eye className='h-4 w-4 mr-2' />
                View
              </Button>
              <Button
                variant={isEditing ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setIsEditing(true)}
                className='h-8 px-3 text-sm font-medium'
              >
                <Edit3 className='h-4 w-4 mr-2' />
                Edit
              </Button>
            </div>

            <div className='flex items-center flex-wrap gap-2 text-sm text-muted-foreground min-w-0 max-w-lg overflow-hidden sm:max-w-md md:max-w-lg'>
              {topicState.isExtracting ? (
                <Badge
                  variant='secondary'
                  className='animate-pulse flex-shrink-0'
                >
                  <Sparkles className='h-3 w-3 mr-1' />
                  Analyzing...
                </Badge>
              ) : topicState.error ? (
                <Badge variant='destructive' className='text-xs flex-shrink-0'>
                  Topic extraction failed
                </Badge>
              ) : topicState.topics.length > 0 ? (
                <div className='flex items-center flex-wrap gap-1 min-w-0'>
                  {(showAllTopics
                    ? topicState.topics
                    : topicState.topics.slice(0, isSmallScreen ? 2 : 3)
                  ).map((topic: DocumentTopic) => (
                    <Badge
                      key={topic.id}
                      variant='secondary'
                      className='cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors flex-shrink-0 text-xs max-w-20 sm:max-w-24 truncate'
                      onClick={() => navigateToTopic(topic)}
                      title={`Click to navigate to: ${topic.searchText}`}
                    >
                      {topic.title.length > (isSmallScreen ? 8 : 10)
                        ? `${topic.title.substring(
                            0,
                            isSmallScreen ? 8 : 10
                          )}...`
                        : topic.title}
                    </Badge>
                  ))}
                  {!showAllTopics &&
                    topicState.topics.length > (isSmallScreen ? 2 : 3) && (
                      <Badge
                        variant='outline'
                        className='text-xs text-muted-foreground flex-shrink-0 cursor-pointer hover:bg-muted hover:text-foreground transition-colors'
                        onClick={() => setShowAllTopics(true)}
                        title={`Click to show ${
                          topicState.topics.length - (isSmallScreen ? 2 : 3)
                        } more topics`}
                      >
                        +{topicState.topics.length - (isSmallScreen ? 2 : 3)}
                      </Badge>
                    )}
                  {showAllTopics &&
                    topicState.topics.length > (isSmallScreen ? 2 : 3) && (
                      <Badge
                        variant='outline'
                        className='text-xs text-muted-foreground flex-shrink-0 cursor-pointer hover:bg-muted hover:text-foreground transition-colors'
                        onClick={() => setShowAllTopics(false)}
                        title='Click to show fewer topics'
                      >
                        Show less
                      </Badge>
                    )}
                </div>
              ) : (
                <Badge
                  variant='outline'
                  className='text-xs text-muted-foreground flex-shrink-0'
                >
                  No topics detected
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {isEditing && (
        <div className='border-b border-border bg-muted/30'>
          {/* Primary Toolbar - Core Editor Functions */}
          <div className='flex items-center justify-between gap-1 p-2'>
            <div className='flex items-center gap-1'>
              {/* Text Formatting */}
              <div className='flex items-center gap-1'>
                <Button
                  variant={editor.isActive('bold') ? 'default' : 'ghost'}
                  size='sm'
                  className='h-8 w-8 p-0'
                  onClick={() => toggleFormat('bold')}
                  title='Bold'
                >
                  <Bold className='h-4 w-4' />
                </Button>
                <Button
                  variant={editor.isActive('italic') ? 'default' : 'ghost'}
                  size='sm'
                  className='h-8 w-8 p-0'
                  onClick={() => toggleFormat('italic')}
                  title='Italic'
                >
                  <Italic className='h-4 w-4' />
                </Button>
                <Button
                  variant={editor.isActive('underline') ? 'default' : 'ghost'}
                  size='sm'
                  className='h-8 w-8 p-0'
                  onClick={() => toggleFormat('underline')}
                  title='Underline'
                >
                  <Underline className='h-4 w-4' />
                </Button>
              </div>

              <Separator orientation='vertical' className='h-6' />

              {/* Alignment */}
              <div className='flex items-center gap-1'>
                <Button
                  variant={
                    editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'
                  }
                  size='sm'
                  className='h-8 w-8 p-0'
                  onClick={() => setAlignment('left')}
                  title='Align Left'
                >
                  <AlignLeft className='h-4 w-4' />
                </Button>
                <Button
                  variant={
                    editor.isActive({ textAlign: 'center' })
                      ? 'default'
                      : 'ghost'
                  }
                  size='sm'
                  className='h-8 w-8 p-0'
                  onClick={() => setAlignment('center')}
                  title='Align Center'
                >
                  <AlignCenter className='h-4 w-4' />
                </Button>
                <Button
                  variant={
                    editor.isActive({ textAlign: 'right' })
                      ? 'default'
                      : 'ghost'
                  }
                  size='sm'
                  className='h-8 w-8 p-0'
                  onClick={() => setAlignment('right')}
                  title='Align Right'
                >
                  <AlignRight className='h-4 w-4' />
                </Button>
              </div>

              <Separator orientation='vertical' className='h-6' />

              {/* Lists & Blocks */}
              <div className='flex items-center gap-1'>
                <Button
                  variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
                  size='sm'
                  className='h-8 w-8 p-0'
                  onClick={() => toggleFormat('bulletList')}
                  title='Bullet List'
                >
                  <List className='h-4 w-4' />
                </Button>
                <Button
                  variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
                  size='sm'
                  className='h-8 w-8 p-0'
                  onClick={() => toggleFormat('orderedList')}
                  title='Numbered List'
                >
                  <ListOrdered className='h-4 w-4' />
                </Button>
                <Button
                  variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
                  size='sm'
                  className='h-8 w-8 p-0'
                  onClick={() => toggleFormat('blockquote')}
                  title='Quote'
                >
                  <Quote className='h-4 w-4' />
                </Button>
              </div>

              <Separator orientation='vertical' className='h-6' />

              {/* Basic Insert */}
              <div className='flex items-center gap-1'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 p-0'
                  onClick={insertTable}
                  title='Insert Table'
                >
                  <TableIcon className='h-4 w-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 p-0'
                  onClick={insertImage}
                  title='Insert Image'
                >
                  <ImageIcon className='h-4 w-4' />
                </Button>
                {/* File Upload Button */}
                <div className='relative'>
                  <input
                    type='file'
                    accept={UPLOAD_ACCEPT_ATTRIBUTE}
                    onChange={handleFileUpload}
                    className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                    disabled={isLoading}
                    title={`Upload ${UPLOAD_SUPPORTED_LABEL} files`}
                  />
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 w-8 p-0'
                    title={`Upload Document (${UPLOAD_SUPPORTED_LABEL})`}
                    disabled={isLoading}
                  >
                    <Upload className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>

            {/* View Toggle & Save */}
            <div className='flex items-center gap-2'>
              {(pdfViewAttributes || scannedMarkup || scannedMarkdown) && (
                <div className='flex items-center gap-1'>
                  {pdfViewAttributes && (
                    <Button
                      variant={viewMode === 'pdf' ? 'default' : 'outline'}
                      size='sm'
                      className='h-8 px-2'
                      onClick={() => {
                        if (!pdfViewAttributes) return;
                        setViewMode('pdf');
                        viewModeRef.current = 'pdf';
                      }}
                      disabled={isLoading}
                    >
                      PDF View
                    </Button>
                  )}

                  {scannedMarkdown && (
                    <Button
                      variant={viewMode === 'markdown' ? 'default' : 'outline'}
                      size='sm'
                      className='h-8 px-2'
                      onClick={() => {
                        if (!scannedMarkdown) return;
                        setViewMode('markdown');
                        viewModeRef.current = 'markdown';
                      }}
                      disabled={isLoading}
                    >
                      Markdown View
                    </Button>
                  )}
                </div>
              )}
              <Button
                variant='default'
                size='sm'
                onClick={() => onSave?.(editor.getHTML(), 'html')}
                disabled={isLoading}
                title='Save Document'
              >
                <Save className='h-4 w-4 mr-2' />
                Save
              </Button>
            </div>
          </div>

          {/* Secondary Toolbar - Advanced Features */}
          <div className='flex items-center gap-1 px-2 py-1 border-t border-border/50 bg-muted/20'>
            {/* AI Features */}
            <div className='flex items-center gap-1'>
              <span className='text-xs font-medium text-muted-foreground mr-2'>
                AI:
              </span>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 px-2 text-xs'
                onClick={triggerScanDocument}
                title='Scan PDF to markup'
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className='h-3 w-3 mr-1 animate-spin' />
                ) : (
                  <FileSearch className='h-3 w-3 mr-1' />
                )}
                Scan
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 px-2 text-xs'
                onClick={triggerGapAnalysis}
                title={
                  gapAnalysisGate.ready
                    ? 'Gap Analysis'
                    : gapAnalysisGate.message ?? 'Gap analysis is unavailable.'
                }
                disabled={!gapAnalysisGate.ready}
              >
                <FileSearch className='h-3 w-3 mr-1' />
                Gap Analysis
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 px-2 text-xs'
                onClick={triggerAISummarize}
                title='AI Summarize'
                disabled={!isSummarizeEnabled || isSummarizing}
              >
                <Sparkles className='h-3 w-3 mr-1' />
                Summarize
              </Button>
            </div>

            <Separator orientation='vertical' className='h-5' />

            {/* Content Templates */}
            <div className='flex items-center gap-1'>
              <span className='text-xs font-medium text-muted-foreground mr-2'>
                Insert:
              </span>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 px-2 text-xs'
                onClick={() => insertHeader(1)}
                title='Insert Heading 1'
              >
                <Hash className='h-3 w-3 mr-1' />
                H1
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 px-2 text-xs'
                onClick={() => insertHeader(2)}
                title='Insert Heading 2'
              >
                <Hash className='h-3 w-3 mr-1' />
                H2
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 px-2 text-xs'
                onClick={insertCurrentDate}
                title='Insert Current Date'
              >
                <Clock className='h-3 w-3 mr-1' />
                Date
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 px-2 text-xs'
                onClick={insertTemplate}
                title='Insert Meeting Notes Template'
              >
                <FileText className='h-3 w-3 mr-1' />
                Template
              </Button>
            </div>

            <Separator orientation='vertical' className='h-5' />

            {/* Special Tools */}
            <div className='flex items-center gap-1'>
              <span className='text-xs font-medium text-muted-foreground mr-2'>
                Filynai:
              </span>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 w-7 p-0'
                onClick={insertDivider}
                title='Insert Divider'
              >
                <span className='text-xs'>―</span>
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 w-7 p-0'
                onClick={insertCommentBox}
                title='Insert Comment Box'
              >
                <MessageSquare className='h-3 w-3' />
              </Button>
              <Button
                variant={
                  editor.isActive('textStyle', { backgroundColor: '#ffeb3b' })
                    ? 'default'
                    : 'ghost'
                }
                size='sm'
                className='h-7 w-7 p-0'
                onClick={highlightText}
                title='Highlight Text'
              >
                <Star className='h-3 w-3' />
              </Button>
            </div>

            <div className='flex-1' />

            {/* Debug Button (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant='ghost'
                size='sm'
                className='h-7 px-2 text-xs opacity-50'
                onClick={() => {}}
                title='Debug AI Commands'
              >
                🐛 Debug
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className='flex-1'>
        {isEditing ? (
          <div className='relative'>
            <div className='p-6 space-y-4'>
              {summaryError && (
                <div className='rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'>
                  {summaryError}
                </div>
              )}

              {gapResult ? (
                <div className='grid gap-6 lg:grid-cols-2 min-h-[75vh]'>
                  <div className='flex flex-col h-full'>
                    <div className='flex items-center justify-between mb-3'>
                      <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
                        Gap Analysis Findings
                      </h3>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setGapResult(null);
                          updateGapError(null);
                          setHighlightedParagraph(null);
                        }}
                      >
                        Return to editor
                      </Button>
                    </div>
                    {gapError && (
                      <div className='mb-3 rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive'>
                        {gapError}
                      </div>
                    )}
                    <div className='flex-1 overflow-auto rounded border border-border/50 bg-muted/20 p-3 space-y-2'>
                      {renderGapResult(gapResult)}
                    </div>
                  </div>
                  <div>
                    <div className='flex items-center justify-between mb-3'>
                      <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
                        Source Content
                      </h3>
                    </div>
                    <div className='space-y-4 overflow-auto h-full pr-1'>
                      {sourceDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className='rounded-md border border-border/50 bg-muted/20 p-3'
                        >
                          <div className='mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                            <span className='inline-flex items-center gap-2'>
                              <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold'>
                                {docLabels.get(doc.id) ?? '—'}
                              </span>
                              <span>{doc.title}</span>
                            </span>
                            <span>{doc.type}</span>
                          </div>
                          {doc.awaitingExtraction ? (
                            <div className='flex items-center gap-2 rounded border border-border/40 bg-background/60 p-3 text-sm text-muted-foreground'>
                              <Loader2 className='h-4 w-4 animate-spin text-primary' />
                              Extracting full PDF text…
                            </div>
                          ) : doc.paragraphs && doc.paragraphs.length > 0 ? (
                            <div className='space-y-3'>
                              {doc.paragraphs.map((paragraph) => {
                                const domId = toParagraphDomId(paragraph.id);
                                const isHighlighted =
                                  highlightedParagraph === paragraph.id;
                                const meta = paragraphMeta[paragraph.id];
                                return (
                                  <div
                                    key={paragraph.id}
                                    id={domId}
                                    className={`rounded border p-3 transition-colors ${
                                      isHighlighted
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border/40 bg-background/60'
                                    }`}
                                  >
                                    <div className='mb-2 text-xs font-semibold uppercase text-muted-foreground'>
                                      {meta
                                        ? `${meta.docLabel}§${meta.index + 1}`
                                        : paragraph.id}
                                    </div>
                                    <pre className='whitespace-pre-wrap text-sm leading-relaxed'>
                                      {paragraph.text}
                                    </pre>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className='rounded border border-border/40 bg-background/60 p-3 text-sm text-muted-foreground'>
                              No text available for this document.
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : summaryResult ? (
                <div className='grid gap-6 lg:grid-cols-2 min-h-[75vh]'>
                  <div>
                    <div className='flex items-center justify-between mb-3'>
                      <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
                        Source Content
                      </h3>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setSummaryResult(null);
                          updateSummaryError(null);
                          setEditableSummary('');
                          setHighlightedParagraph(null);
                          if (highlightTimeoutRef.current) {
                            clearTimeout(highlightTimeoutRef.current);
                            highlightTimeoutRef.current = null;
                          }
                        }}
                      >
                        Return to editor
                      </Button>
                    </div>
                    <div className='space-y-4 overflow-auto h-full pr-1'>
                      {sourceDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className='rounded-md border border-border/50 bg-muted/20 p-3'
                        >
                          <div className='mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                            <span className='inline-flex items-center gap-2'>
                              <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold'>
                                {docLabels.get(doc.id) ?? '—'}
                              </span>
                              <span>{doc.title}</span>
                            </span>
                            <span>{doc.type}</span>
                          </div>
                          {doc.awaitingExtraction ? (
                            <div className='flex items-center gap-2 rounded border border-border/40 bg-background/60 p-3 text-sm text-muted-foreground'>
                              <Loader2 className='h-4 w-4 animate-spin text-primary' />
                              Extracting full PDF text…
                            </div>
                          ) : doc.paragraphs && doc.paragraphs.length > 0 ? (
                            <div className='space-y-3'>
                              {doc.paragraphs.map((paragraph) => {
                                const domId = toParagraphDomId(paragraph.id);
                                const isHighlighted =
                                  highlightedParagraph === paragraph.id;
                                const meta = paragraphMeta[paragraph.id];
                                return (
                                  <div
                                    key={paragraph.id}
                                    id={domId}
                                    className={`rounded border p-3 transition-colors ${
                                      isHighlighted
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border/40 bg-background/60'
                                    }`}
                                  >
                                    <div className='mb-2 text-xs font-semibold uppercase text-muted-foreground'>
                                      {meta
                                        ? `${meta.docLabel}§${meta.index + 1}`
                                        : paragraph.id}
                                    </div>
                                    <pre className='whitespace-pre-wrap text-sm leading-relaxed'>
                                      {paragraph.text}
                                    </pre>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className='rounded border border-border/40 bg-background/60 p-3 text-sm text-muted-foreground'>
                              No text available for this document.
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className='flex flex-col h-full'>
                    <div className='flex items-center justify-between mb-3'>
                      <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
                        Generated Summary
                      </h3>
                      <Button
                        variant='default'
                        size='sm'
                        onClick={openSaveDialog}
                        disabled={!editableSummary.trim()}
                      >
                        Save Summary
                      </Button>
                    </div>
                    <textarea
                      value={editableSummary}
                      onChange={(event) =>
                        setEditableSummary(event.target.value)
                      }
                      className='w-full flex-1 min-h-[300px] resize-vertical rounded-md border border-border/60 bg-background p-4 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
                      placeholder='Edit the generated summary...'
                    />
                    <div className='mt-3 rounded border border-border/50 bg-muted/20 p-3 space-y-2 flex-1 overflow-auto'>
                      <p className='text-xs font-semibold uppercase text-muted-foreground tracking-wide'>
                        Preview with references
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Maintain citations using the format{' '}
                        <code>[ref:paragraph-id]</code>. Click a reference badge
                        to locate the source paragraph.
                      </p>
                      <div className='space-y-2'>
                        {renderSummaryPreview(editableSummary)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {viewMode === 'pdf' && pdfViewAttributes ? (
                    <div className='min-h-[500px] rounded-md border border-border/50 bg-muted/10 p-4'>
                      <div
                        className='pdf-embed-wrapper my-6'
                        data-type='pdf-embed'
                        data-src={pdfViewAttributes.src}
                        data-title={pdfViewAttributes.title ?? ''}
                        data-height={pdfViewAttributes.height}
                      >
                        <iframe
                          src={pdfViewAttributes.src}
                          title={pdfViewAttributes.title ?? 'Embedded PDF'}
                          className='pdf-embed-frame w-full rounded-md'
                          width='100%'
                          height={pdfViewAttributes.height}
                          allow='fullscreen'
                        />
                      </div>
                    </div>
                  ) : null}
                 <div className={viewMode === 'pdf' ? 'hidden' : undefined}>
                    <EditorContent
                      editor={editor}
                      className='min-h-[500px] focus-within:outline-none prose prose-sm max-w-none'
                    />
                  </div>
                </>
              )}
            </div>

            {!summaryResult &&
              viewMode !== 'pdf' &&
              suggestionState.isVisible &&
              suggestionState.position && (
                <div
                  className='fixed z-50 animate-bounce'
                  style={{
                    left: suggestionState.position.left,
                    top: suggestionState.position.top,
                  }}
                >
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() =>
                      setSuggestionState((prev) => ({
                        ...prev,
                        showDialog: true,
                      }))
                    }
                    className='bg-yellow-200 hover:bg-yellow-300 border-2 border-yellow-500 rounded-full p-3 shadow-xl animate-bounce'
                    title='Click for writing suggestions'
                  >
                    <Lightbulb className='h-6 w-6 text-yellow-700' />
                  </Button>
                </div>
              )}

            {!summaryResult && viewMode !== 'pdf' && (
              <FloatingMenu editor={editor}>
                <div className='flex items-center gap-1 bg-white dark:bg-gray-800 border border-border rounded-lg shadow-lg p-1'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => insertHeader(1)}
                    className='h-8 px-2 text-xs'
                    title='Heading 1'
                  >
                    H1
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => insertHeader(2)}
                    className='h-8 px-2 text-xs'
                    title='Heading 2'
                  >
                    H2
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() =>
                      editor.chain().focus().toggleBulletList().run()
                    }
                    className='h-8 w-8 p-0'
                    title='Bullet List'
                  >
                    <List className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={insertTemplate}
                    className='h-8 w-8 p-0'
                    title='Insert Template'
                  >
                    <FileText className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={insertCommentBox}
                    className='h-8 w-8 p-0'
                    title='Insert Comment'
                  >
                    <MessageSquare className='h-4 w-4' />
                  </Button>
                  <Separator orientation='vertical' className='h-6 mx-1' />
                </div>
              </FloatingMenu>
            )}

            {!summaryResult && viewMode !== 'pdf' && (
              <BubbleMenu editor={editor}>
                <div className='flex items-center gap-1 bg-white dark:bg-gray-800 border border-border rounded-lg shadow-lg p-1'>
                  <Button
                    variant={editor.isActive('bold') ? 'default' : 'ghost'}
                    size='sm'
                    onClick={() => toggleFormat('bold')}
                    className='h-8 w-8 p-0'
                    title='Bold'
                  >
                    <Bold className='h-4 w-4' />
                  </Button>
                  <Button
                    variant={editor.isActive('italic') ? 'default' : 'ghost'}
                    size='sm'
                    onClick={() => toggleFormat('italic')}
                    className='h-8 w-8 p-0'
                    title='Italic'
                  >
                    <Italic className='h-4 w-4' />
                  </Button>
                  <Button
                    variant={editor.isActive('code') ? 'default' : 'ghost'}
                    size='sm'
                    onClick={() => toggleFormat('code')}
                    className='h-8 w-8 p-0'
                    title='Code'
                  >
                    <Code className='h-4 w-4' />
                  </Button>
                  <Button
                    variant={
                      editor.isActive('textStyle', {
                        backgroundColor: '#ffeb3b',
                      })
                        ? 'default'
                        : 'ghost'
                    }
                    size='sm'
                    onClick={highlightText}
                    className='h-8 w-8 p-0'
                    title='Highlight'
                  >
                    <Star className='h-4 w-4' />
                  </Button>
                  <Separator orientation='vertical' className='h-6 mx-1' />
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={triggerGapAnalysis}
                    className='h-8 px-2 text-xs'
                    title={
                      gapAnalysisGate.ready
                        ? 'Run Gap Analysis'
                        : gapAnalysisGate.message ??
                          'Gap analysis is unavailable.'
                    }
                    disabled={!gapAnalysisGate.ready}
                  >
                    <FileSearch className='h-4 w-4 mr-1' />
                    Gap Analysis
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={triggerAISummarize}
                    className='h-8 px-2 text-xs'
                    title='Summarize with AI'
                    disabled={!isSummarizeEnabled || isSummarizing}
                  >
                    <Sparkles className='h-4 w-4 mr-1' />
                    Summarize
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={insertCommentBox}
                    className='h-8 px-2 text-xs'
                    title='Add Comment'
                  >
                    <MessageSquare className='h-4 w-4 mr-1' />
                    Comment
                  </Button>
                </div>
              </BubbleMenu>
            )}
          </div>
        ) : (
          // View Mode
          <div className='p-6'>
            <div
              className='prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none'
              dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
            />
          </div>
        )}
      </div>

      <Dialog
        open={saveDialogOpen}
        onOpenChange={(open) => {
          if (isSavingSummary) {
            return;
          }
          setSaveDialogOpen(open);
          if (!open) {
            setSaveFeedback(null);
            setCustomFileName('');
          }
        }}
      >
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>{saveConfig.dialogTitle}</DialogTitle>
            <DialogDescription>
              Choose how you want to store this summary. Provide an alternate
              name if you need a draft copy in the current section.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='rounded border border-border/40 bg-muted/20 p-3 text-sm text-muted-foreground'>
              Saving with the primary option will create{' '}
              <strong>{saveConfig.primaryFileName}</strong> under{' '}
              <strong>summaries/{saveConfig.primaryFolder}</strong>.
            </div>

            <div className='space-y-2'>
              <p className='text-xs font-semibold uppercase text-muted-foreground tracking-wide'>
                Alternate file name (for {saveConfig.secondaryFolder})
              </p>
              <Input
                value={customFileName}
                onChange={(event) => setCustomFileName(event.target.value)}
                placeholder={saveConfig.inputPlaceholder}
                disabled={isSavingSummary}
              />
              <p className='text-xs text-muted-foreground'>
                If you use the alternate option, the summary is stored in{' '}
                <strong>summaries/{saveConfig.secondaryFolder}</strong> with
                this name.
              </p>
            </div>

            {saveFeedback && (
              <div
                className={`rounded border p-3 text-sm ${
                  saveFeedback.type === 'success'
                    ? 'border-emerald-400/60 bg-emerald-50 text-emerald-700'
                    : 'border-destructive/40 bg-destructive/10 text-destructive'
                }`}
              >
                {saveFeedback.message}
              </div>
            )}
          </div>

          <DialogFooter className='gap-2'>
            <Button
              variant='outline'
              onClick={handleSecondarySave}
              disabled={isSavingSummary || !editableSummary.trim()}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePrimarySave}
              disabled={isSavingSummary || !editableSummary.trim()}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={gapDialogOpen || isGapAnalyzing}
        onOpenChange={(open) => {
          if (isGapAnalyzing) {
            return;
          }
          setGapDialogOpen(open);
          if (!open) {
            updateGapError(null);
          }
        }}
      >
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>Gap Analysis</DialogTitle>
            <DialogDescription>
              {gapError
                ? 'Unable to start gap analysis. Review the message below.'
                : 'Reviewing documents for missing information, rule violations, and grammar issues.'}
            </DialogDescription>
          </DialogHeader>
          <div className='flex items-center gap-2 py-4'>
            {isGapAnalyzing ? (
              <>
                <Loader2 className='h-5 w-5 animate-spin text-primary' />
                <span className='text-sm text-muted-foreground'>
                  Analyzing… this may take a while.
                </span>
              </>
            ) : gapError ? (
              <p className='text-sm text-destructive'>{gapError}</p>
            ) : (
              <p className='text-sm text-muted-foreground'>
                Gap analysis completed.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setGapDialogOpen(false)}
              disabled={isGapAnalyzing}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={fixDialogOpen}
        onOpenChange={(open) => {
          setFixDialogOpen(open);
          if (!open) {
            setPendingFixText('');
          }
        }}
      >
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Suggested Fix</DialogTitle>
            <DialogDescription>
              Review the recommendation below. Choose Insert to add it to the
              document or Cancel to dismiss.
            </DialogDescription>
          </DialogHeader>
          <div className='border border-border/50 bg-muted/20 p-3 rounded-md text-sm leading-relaxed whitespace-pre-wrap'>
            {pendingFixText}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setFixDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFixInsert} disabled={!pendingFixText.trim()}>
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summarize Dialog */}
      <Dialog
        open={summaryDialog.isOpen}
        onOpenChange={(open) =>
          setSummaryDialog((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {summaryDialog.sourceSectionName
                ? summaryDialog.sourceSectionName
                    .toLowerCase()
                    .trim()
                    .endsWith('summary')
                  ? summaryDialog.sourceSectionName
                  : `${summaryDialog.sourceSectionName} Summary`
                : 'Section Summary'}
            </DialogTitle>
            <DialogDescription>
              Review the source files that will feed this summary and confirm
              the target destination before running the assistive workflow.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-2'>
            <div>
              <p className='text-sm font-medium text-foreground'>
                Source files
              </p>
              {summaryDialog.sourceDocuments.length > 0 ? (
                <ul className='mt-2 space-y-1'>
                  {summaryDialog.sourceDocuments.map((doc) => (
                    <li
                      key={doc.id}
                      className='flex items-center gap-2 text-sm text-muted-foreground'
                    >
                      <FileText className='h-3 w-3 text-muted-foreground/80' />
                      <span className='font-medium text-foreground'>
                        {doc.title}
                      </span>
                      <span className='text-xs uppercase tracking-wide text-muted-foreground/70'>
                        {doc.type}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='mt-2 text-sm text-muted-foreground'>
                  No additional files detected in this section.
                </p>
              )}
            </div>

            <div className='rounded-md border border-dashed border-border/60 bg-muted/40 p-3 text-sm'>
              <p className='font-medium text-foreground'>Summary target</p>
              <p className='text-muted-foreground mt-1'>
                {summaryDialog.targetSectionName}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() =>
                setSummaryDialog((prev) => ({ ...prev, isOpen: false }))
              }
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleGenerateSummary();
              }}
              disabled={isSummarizing}
            >
              Generate Summary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Smart Suggestion Dialog */}
      <Dialog
        open={suggestionState.showDialog}
        onOpenChange={(open) =>
          setSuggestionState((prev) => ({ ...prev, showDialog: open }))
        }
      >
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Lightbulb className='h-5 w-5 text-yellow-500' />
              Writing Suggestion
            </DialogTitle>
          </DialogHeader>
          <div className='py-4'>
            <p className='text-sm text-muted-foreground mb-3'>
              {suggestionState.suggestion?.context}
            </p>
            <div className='bg-muted p-3 rounded-lg'>
              <p className='text-sm font-medium'>Suggested text:</p>
              <p className='text-sm mt-1'>{suggestionState.suggestion?.text}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() =>
                setSuggestionState((prev) => ({
                  ...prev,
                  showDialog: false,
                  isVisible: false,
                }))
              }
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (suggestionState.suggestion?.text && editor) {
                  editor
                    .chain()
                    .focus()
                    .insertContent(suggestionState.suggestion.text)
                    .run();
                  setSuggestionState((prev) => ({
                    ...prev,
                    showDialog: false,
                    isVisible: false,
                  }));
                }
              }}
            >
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!scanError}
        onOpenChange={(open) => {
          if (!open) {
            setScanError(null);
          }
        }}
      >
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Scan failed</DialogTitle>
            <DialogDescription>{scanError}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='default' onClick={() => setScanError(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer with stats */}
      <div className='border-t border-border bg-muted/30 px-6 py-2'>
        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          <div className='flex items-center gap-4'>
            <span>Characters: {stats.characters}</span>
            <span>Words: {stats.words}</span>
            <span>Sentences: {stats.sentences}</span>
          </div>
          {isLoading && (
            <div className='flex items-center gap-2'>
              <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-primary'></div>
              <span>Processing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

// Author: Bin Lee (blee@filynai.com)
// Description: Composes the workspace layout, wiring together file panels, viewer, and tool integrations.

import { Menu, Settings, Share } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { DocumentViewer } from './document-viewer';
import { FileList } from './file-list';
import { MinimizedToolbox } from './minimized-toolbox';
import { ToolWindow } from './tool-window';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import type { IndClassification } from '@/lib/smart-editor/ind-classifier';
import { formatDistanceToNow } from 'date-fns';
import type { StoredDocumentWithUrl } from '@/lib/smart-editor/document-metadata';

// Document and Section interfaces
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

interface ApiSection {
  id: string;
  name: string;
  expanded?: boolean;
  documents: StoredDocumentWithUrl[];
}

interface SectionsResponse {
  sections: ApiSection[];
}

const formatLastModified = (uploadedAt?: string): string => {
  if (!uploadedAt) {
    return 'Unknown';
  }
  const date = new Date(uploadedAt);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Unknown';
  }
};

const transformDocument = (doc: StoredDocumentWithUrl): Document => {
  return {
    id: doc.id,
    title: doc.title || doc.originalFileName || 'Untitled document',
    type: doc.type || 'Document',
    lastModified: formatLastModified(doc.uploadedAt),
    sources: doc.sources ?? 1,
    starred: doc.starred ?? false,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    content: doc.content ?? undefined,
    pdfSource: doc.fileUrl ?? undefined,
    extractedText: doc.textContent ?? undefined,
    indClassification: doc.indClassification as IndClassification | undefined,
    originalPath: doc.originalPath ?? undefined,
    warning: doc.warning ?? undefined,
    uploadedAt: doc.uploadedAt,
    fileKey: doc.fileKey,
    fileUrl: doc.fileUrl ?? null,
  };
};

const findFirstDocumentId = (sections: ApiSection[]): string | null => {
  for (const section of sections) {
    if (section.documents.length > 0) {
      return section.documents[0].id;
    }
  }
  return null;
};

const findSectionIdByDocument = (
  sections: ApiSection[],
  documentId?: string
): string | undefined => {
  if (!documentId) {
    return undefined;
  }
  for (const section of sections) {
    if (section.documents.some((doc) => doc.id === documentId)) {
      return section.id;
    }
  }
  return undefined;
};

export function NotebookLayout() {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

const refreshSections = useCallback(
  async (options?: { expandSectionId?: string; selectDocumentId?: string }) => {
    setIsLoading(true);
    setIsRefreshing(true);

    try {
      const response = await fetch('/api/smart-editor/sections', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        let message = `Failed to load sections (${response.status})`;
        try {
          const text = await response.text();
          if (text) {
            const parsed = JSON.parse(text) as { error?: string };
            if (parsed.error) {
              message = parsed.error;
            } else if (text.trim()) {
              message = text.trim();
            }
          }
        } catch {
          // ignore parsing errors
        }
        throw new Error(message);
      }

      const data = (await response.json()) as SectionsResponse;
      const apiSections = data.sections ?? [];
      const sectionIdForSelection =
        options?.expandSectionId ??
        findSectionIdByDocument(apiSections, options?.selectDocumentId);
      const firstDocumentId = findFirstDocumentId(apiSections);

      setSections((previousSections) => {
        const previousExpandedState = new Map(
          previousSections.map((section) => [section.id, section.expanded])
        );

        return apiSections.map((section, index) => {
          const documents = section.documents.map(transformDocument);
          const defaultExpanded = section.expanded ?? index === 0;
          const expanded =
            sectionIdForSelection && section.id === sectionIdForSelection
              ? true
              : previousExpandedState.has(section.id)
              ? (previousExpandedState.get(section.id) as boolean)
              : defaultExpanded;

          return {
            id: section.id,
            name: section.name,
            expanded,
            documents,
          };
        });
      });

      setSelectedDocument((currentSelected) => {
        if (options?.selectDocumentId) {
          return options.selectDocumentId;
        }
        if (currentSelected) {
          const stillExists = apiSections.some((section) =>
            section.documents.some((doc) => doc.id === currentSelected)
          );
          if (stillExists) {
            return currentSelected;
          }
        }
        return firstDocumentId;
      });

      setError(null);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to load sections from storage.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  },
  []
);

  useEffect(() => {
    void refreshSections();
  }, [refreshSections]);

  const handleDocumentsUploaded = useCallback(
    async (result: {
      sectionId: string;
      sectionName: string;
      documents: StoredDocumentWithUrl[];
    }) => {
      const targetDocumentId = result.documents[0]?.id;
      await refreshSections({
        expandSectionId: result.sectionId,
        selectDocumentId: targetDocumentId,
      });
    },
    [refreshSections]
  );

  const handleManualRefresh = useCallback(() => {
    void refreshSections();
  }, [refreshSections]);

  // Helper function to find a document and its section by ID
  const findDocumentContext = (
    documentId: string
  ): { document: Document | null; section: Section | null } => {
    if (!documentId) {
      return { document: null, section: null };
    }

    for (const section of sections) {
      const document = section.documents.find((doc) => doc.id === documentId);
      if (document) {
        return { document, section };
      }
    }
    return { document: null, section: null };
  };

  const handleToolClick = (tool: string) => {
    if (activeTool === tool) {
      setActiveTool(null); // Close if same tool clicked
    } else {
      setActiveTool(tool); // Open new tool
    }
  };

  const handleToolClose = () => {
    setActiveTool(null);
  };

  const { document: activeDocument, section: activeSection } = selectedDocument
    ? findDocumentContext(selectedDocument)
    : { document: null, section: null };

  return (
    <TooltipProvider>
      <div className="smart-editor-theme flex h-full w-full bg-background">
        
        {/* Left Sidebar - File List */}
        <div className="relative">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute top-2 -right-4 z-50 bg-background border border-border rounded-md p-1 shadow"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          <div
            className={`${
              sidebarCollapsed ? 'w-0' : 'w-96'
            } transition-all duration-300 border-r border-border flex-shrink-0`}
          >
            <FileList
              sections={sections}
              setSections={setSections}
              onDocumentSelect={setSelectedDocument}
              selectedDocument={selectedDocument}
              onExtractTopics={() => {
                window.dispatchEvent(new CustomEvent('manual-topic-extract'));
              }}
              onDocumentsUploaded={handleDocumentsUploaded}
              onRefreshSections={handleManualRefresh}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
              loadError={error}
            />
          </div>
        </div>

        {/* Center Panel - Document Viewer */}
        <div className="flex-1 flex flex-col relative">
          <DocumentViewer
            selectedDocument={selectedDocument}
            document={activeDocument}
            sectionName={activeSection?.name}
            sectionId={activeSection?.id}
            sectionDocuments={activeSection?.documents}
          />
          <ToolWindow tool={activeTool} onClose={handleToolClose} />
        </div>

        {/* Right Panel - Minimized Toolbox */}
        <div className="border-l border-border flex-shrink-0">
          <MinimizedToolbox
            selectedDocument={selectedDocument}
            onToolSelect={handleToolClick}
          />
        </div>

      </div>
    </TooltipProvider>
  );
}

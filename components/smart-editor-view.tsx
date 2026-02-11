// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
'use client';

import { AddFromTemplateDialog } from '@/components/section-editor/add-from-template-dialog';
import { OnboardingTour } from '@/components/section-editor/onboarding-tour';
import { PdfUploadDialog } from '@/components/section-editor/pdf-upload-dialog';
import { SectionEditor } from '@/components/section-editor/section-editor';
import { Sidebar } from '@/components/section-editor/sidebar';
import { TiptapEditor } from '@/components/section-editor/tiptap-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useProject } from '@/hooks/useProject';
import { useTenant } from '@/hooks/useTenant';
import { upsertSectionPath } from '@/lib/section-tree';
import type { Section, SubsectionContent } from '@/types/section';
import { HelpCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

// Default empty template; actual sections are fetched from S3.
// No hardcoded template; always load from S3

export function SmartEditorView() {
  const { selectedProjectId, currentProject } = useProject();
  const { tenants, selectedTenantId } = useTenant();
  const [sectionData, setSectionData] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedSubsection, setSelectedSubsection] =
    useState<SubsectionContent | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAddFromTemplate, setShowAddFromTemplate] = useState(false);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [fileMode, setFileMode] = useState<'md' | 'pdf' | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileText, setFileText] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [hasSeenTour, setHasSeenTour] = useLocalStorage<boolean>(
    'hasSeenOnboardingTour',
    false,
  );
  const [treeRetryKey, setTreeRetryKey] = useState(0);
  const [usedCachedTree, setUsedCachedTree] = useState(false);
  const [treeCacheKey, setTreeCacheKey] = useState<string | null>(null);

  const deriveCompany = () => {
    let companyValue: string | undefined;
    if (
      currentProject?.metadata &&
      typeof currentProject.metadata === 'object' &&
      currentProject.metadata !== null
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = currentProject.metadata as any;
      if (m.company) companyValue = String(m.company);
    }
    const tenantEntry = tenants.find((t) => t.id === selectedTenantId);
    if (!companyValue) {
      companyValue =
        tenantEntry?.name ||
        currentProject?.tenantId ||
        selectedTenantId ||
        'unknown-company';
    }
    return companyValue;
  };

  const deriveProjectName = () => {
    let projectNameValue: string | undefined;
    if (
      currentProject?.metadata &&
      typeof currentProject.metadata === 'object' &&
      currentProject.metadata !== null
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = currentProject.metadata as any;
      if (m.ind_title) projectNameValue = String(m.ind_title);
    }
    if (!projectNameValue) {
      projectNameValue =
        currentProject?.title ||
        currentProject?.code ||
        currentProject?.id ||
        'unknown-project';
    }
    return projectNameValue;
  };

  const companyValue = deriveCompany();
  const projectNameValue = deriveProjectName();
  const derivePrimaryS3Key = () => {
    if (
      currentProject?.metadata &&
      typeof currentProject.metadata === 'object' &&
      currentProject.metadata !== null &&
      'primaryDocumentS3Key' in currentProject.metadata
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = currentProject.metadata as any;
      if (m.primaryDocumentS3Key) return String(m.primaryDocumentS3Key);
    }
    return undefined;
  };
  const primaryS3Key = derivePrimaryS3Key();

  const markdownToHtml = (md: string) => {
    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const escaped = escapeHtml(md);
    const blocks = escaped
      .replace(/\r\n/g, '\n')
      .split(/\n{2,}/)
      .map((block) => `<p>${block.replace(/\n/g, '<br />')}</p>`)
      .join('');

    return blocks || '<p></p>';
  };

  const toSectionNumber = (value?: string | null) => {
    if (!value) return null;
    const match = value.match(/^(\d+(?:\.\d+)*)(?:[^\d.]|$)/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    if (!hasSeenTour) {
      setShowTour(true);
    }
  }, [hasSeenTour]);

  useEffect(() => {
    if (!sectionData.length) {
      setSelectedSection(null);
      setSelectedSubsection(null);
      return;
    }
    if (!selectedSection) {
      setSelectedSection(sectionData[0]);
      setSelectedSubsection(null);
      return;
    }
    const updatedSection = sectionData.find((s) => s.id === selectedSection.id);
    if (updatedSection) {
      setSelectedSection(updatedSection);
    } else {
      setSelectedSection(sectionData[0]);
      setSelectedSubsection(null);
    }
  }, [sectionData, selectedSection]);

  // Load section tree from S3 based on the selected project
  const buildTreeCacheKey = (
    projectId: string,
    s3Key?: string,
    company?: string,
    projectName?: string,
  ) =>
    [
      'sectionTree',
      projectId || 'no-project',
      s3Key || 'no-s3key',
      company || 'no-company',
      projectName || 'no-projectName',
    ].join(':');

  const loadCachedTree = (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { ts: number; sections: Section[] };
      const tenMinutes = 10 * 60 * 1000;
      if (Date.now() - parsed.ts > tenMinutes) return null;
      return parsed.sections;
    } catch {
      return null;
    }
  };

  const saveTreeCache = (key: string, sections: Section[]) => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), sections }));
    } catch {
      // ignore quota errors
    }
  };

  useEffect(() => {
    const loadTree = async () => {
      if (!selectedProjectId) {
        setSectionData([]);
        setSelectedSection(null);
        setSelectedSubsection(null);
        return;
      }

      let cacheHit = false;
      let abortTimer: ReturnType<typeof setTimeout> | null = null;
      setUsedCachedTree(false);
      setIsLoadingTree(true);
      setTreeError(null);

      try {
        const s3Key =
          typeof currentProject?.metadata === 'object' &&
          currentProject?.metadata !== null &&
          'primaryDocumentS3Key' in currentProject.metadata
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (currentProject.metadata as any).primaryDocumentS3Key
            : undefined;

        const url = new URL(
          `/api/projects/${selectedProjectId}/sections`,
          window.location.origin,
        );
        if (s3Key) {
          url.searchParams.set('s3Key', s3Key);
        }
        let companyValue: string | undefined;
        let projectNameValue: string | undefined;

        if (
          currentProject?.metadata &&
          typeof currentProject.metadata === 'object' &&
          currentProject.metadata !== null
        ) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const m = currentProject.metadata as any;
          if (m.company) companyValue = String(m.company);
          if (m.ind_title) projectNameValue = String(m.ind_title);
        }

        const tenantEntry = tenants.find((t) => t.id === selectedTenantId);
        if (!companyValue) {
          companyValue =
            tenantEntry?.name ||
            currentProject?.tenantId ||
            selectedTenantId ||
            'unknown-company';
        }

        if (!projectNameValue) {
          projectNameValue =
            currentProject?.title ||
            currentProject?.code ||
            currentProject?.id ||
            'unknown-project';
        }

        url.searchParams.set('company', companyValue);
        url.searchParams.set('projectName', projectNameValue);

        const abort = new AbortController();
        abortTimer = setTimeout(() => abort.abort(), 30000);
        const cacheKey = buildTreeCacheKey(
          selectedProjectId,
          s3Key || undefined,
          companyValue,
          projectNameValue,
        );
        setTreeCacheKey(cacheKey);
        const cached = loadCachedTree(cacheKey);
        if (cached && cached.length) {
          cacheHit = true;
          setUsedCachedTree(true);
          setSectionData(cached);
          setSelectedSection(cached[0] ?? null);
          setSelectedSubsection(null);
          setIsLoadingTree(false);
        }

        const res = await fetch(url.toString(), { signal: abort.signal });
        if (!res.ok) {
          const errPayload = await res.json().catch(() => null);
          throw new Error(
            errPayload?.message ||
              errPayload?.error ||
              'Failed to load section tree',
          );
        }

        const payload = await res.json();
        const fetchedSections = (payload?.sections ?? []) as Section[];

        setSectionData(fetchedSections);
        setSelectedSection(fetchedSections[0] ?? null);
        setSelectedSubsection(null);
        saveTreeCache(cacheKey, fetchedSections);
        setUsedCachedTree(false);
      } catch (error) {
        console.error('[SmartEditor] failed to load section tree', error);
        setTreeError(
          error instanceof DOMException && error.name === 'AbortError'
            ? 'Section tree request timed out. Please retry.'
            : error instanceof Error
              ? error.message
              : 'Unable to load section tree',
        );
        if (!cacheHit) {
          setSectionData([]);
          setSelectedSection(null);
          setSelectedSubsection(null);
        }
      } finally {
        if (abortTimer) clearTimeout(abortTimer);
        setIsLoadingTree(false);
      }
    };

    loadTree();
  }, [
    selectedProjectId,
    currentProject,
    selectedTenantId,
    tenants,
    treeRetryKey,
  ]);

  // Load file content (md or pdf) when a file subsection is selected
  useEffect(() => {
    const loadFile = async () => {
      if (!selectedSubsection || selectedSubsection.isCategory) {
        setFileMode(null);
        setFileUrl(null);
        setFileText(null);
        setFileError(null);
        setFileLoading(false);
        return;
      }

      const fullPath =
        (selectedSubsection as { fullPath?: string }).fullPath ||
        selectedSubsection.title;

      console.info('[SmartEditor] file selection', {
        id: selectedSubsection.id,
        title: selectedSubsection.title,
        fullPath,
      });

      setFileLoading(true);
      setFileError(null);
      setFileMode(null);
      setFileUrl(null);
      setFileText(null);

      const mdKey = `${fullPath}.extracted.md`;

      const fetchSigned = async (
        key: string,
        format: 'url' | 'text' = 'url',
      ) => {
        console.info(
          '[SmartEditor] signing url for key',
          key,
          'format',
          format,
        );
        const url = new URL(
          `/api/projects/${selectedProjectId}/asset`,
          window.location.origin,
        );
        url.searchParams.set('key', key);
        url.searchParams.set('format', format);
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`asset api failed ${res.status}`);
        const payload = await res.json();
        return payload;
      };

      try {
        // Try markdown sidecar first
        const mdPayload = await fetchSigned(mdKey, 'text');
        const mdText = (mdPayload as { text?: string }).text;
        if (!mdText) {
          throw new Error('md sidecar empty');
        }
        console.info('[SmartEditor] loaded markdown sidecar', {
          mdKey,
          bytes: mdText.length,
        });
        setFileText(mdText);
        setFileMode('md');
      } catch (mdError) {
        console.warn('[SmartEditor] markdown sidecar missing', mdKey, mdError);
        try {
          const pdfPayload = await fetchSigned(fullPath, 'url');
          setFileUrl((pdfPayload as { url: string }).url);
          setFileMode('pdf');
        } catch (pdfError) {
          setFileError(
            pdfError instanceof Error
              ? pdfError.message
              : 'Unable to load file',
          );
          console.error('[SmartEditor] failed loading file', {
            fullPath,
            pdfError,
          });
        }
      } finally {
        setFileLoading(false);
      }
    };

    loadFile();
  }, [selectedSubsection, selectedProjectId]);

  const handleSelectSection = (section: Section) => {
    setSelectedSection(section);
    setSelectedSubsection(null);
  };

  const handleSelectSubsection = (subsection: SubsectionContent) => {
    setSelectedSubsection(subsection);
    const parentSection = sectionData.find((s) => {
      const findInSubsections = (subs: SubsectionContent[]): boolean => {
        return subs.some((sub) => {
          if (sub.id === subsection.id) return true;
          if (sub.subsections) return findInSubsections(sub.subsections);
          return false;
        });
      };
      return s.subsections && findInSubsections(s.subsections);
    });

    if (
      parentSection &&
      selectedSection &&
      parentSection.id !== selectedSection.id
    ) {
      setSelectedSection(parentSection);
    }
  };

  const handleAddSubsection = (subsectionNumber: string, header: string) => {
    console.log('[v0] Adding subsection:', subsectionNumber, header);

    const newSubsection: SubsectionContent = {
      id: `new-${Date.now()}`,
      subsectionNumber,
      title: header,
      header,
      content: '',
      isRequired: false,
      status: 'draft',
      isUserAdded: true,
    };

    let shouldUpdateSelection = false;
    let newParentSubsection: SubsectionContent | null = null;

    if (!selectedSection) return;
    if (!selectedSection) return;
    if (!selectedSection) return;
    if (!selectedSection) return;
    setSectionData((prevSections) =>
      prevSections.map((section) => {
        if (section.id === selectedSection.id) {
          // Helper function to recursively add subsection to the correct parent
          const addSubsectionRecursive = (
            subs: SubsectionContent[],
          ): SubsectionContent[] => {
            // If we're viewing a category subsection, add to its children
            if (selectedSubsection?.isCategory) {
              return subs.map((sub) => {
                if (sub.id === selectedSubsection.id) {
                  shouldUpdateSelection = true;
                  newParentSubsection = {
                    ...sub,
                    subsections: [...(sub.subsections || []), newSubsection],
                  };
                  return newParentSubsection;
                }
                if (sub.subsections) {
                  return {
                    ...sub,
                    subsections: addSubsectionRecursive(sub.subsections),
                  };
                }
                return sub;
              });
            }
            // If we're viewing a regular subsection's parent
            else if (selectedSubsection) {
              return subs.map((sub) => {
                // Check if this sub contains our selected subsection
                if (
                  sub.subsections?.some((s) => s.id === selectedSubsection.id)
                ) {
                  shouldUpdateSelection = true;
                  newParentSubsection = {
                    ...sub,
                    subsections: [...(sub.subsections || []), newSubsection],
                  };
                  return newParentSubsection;
                }
                if (sub.subsections) {
                  return {
                    ...sub,
                    subsections: addSubsectionRecursive(sub.subsections),
                  };
                }
                return sub;
              });
            }
            // No specific subsection selected, add to top level
            return [...subs, newSubsection];
          };

          return {
            ...section,
            subsections: addSubsectionRecursive(section.subsections || []),
          };
        }
        return section;
      }),
    );

    if (shouldUpdateSelection && newParentSubsection) {
      setTimeout(() => {
        setSelectedSubsection(newParentSubsection);
        setTimeout(() => {
          const element = document.getElementById(
            `section-${subsectionNumber}`,
          );
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }, 50);
    } else {
      setTimeout(() => {
        const element = document.getElementById(`section-${subsectionNumber}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handleCreateFromTemplate = (
    templateNumber: string,
    createdKey?: string,
  ) => {
    const toRelativeKey = (uri: string) => {
      if (uri.startsWith('s3://')) {
        const parts = uri.replace('s3://', '').split('/');
        return parts.slice(1).join('/');
      }
      return uri;
    };

    const result = upsertSectionPath(sectionData, templateNumber);

    if (createdKey) {
      const relKey = toRelativeKey(createdKey);
      result.leaf.fullPath = relKey;
    }

    setSectionData(result.sections);
    if (treeCacheKey) {
      saveTreeCache(treeCacheKey, result.sections);
    }
    setSelectedSection(result.section);
    setSelectedSubsection(result.leaf);
    setTreeRetryKey((k) => k + 1); // refresh from S3 to reflect real file
    setTimeout(() => {
      const element = document.getElementById(
        `section-${result.leaf.subsectionNumber}`,
      );
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  };

  const handleCloseTour = () => {
    setShowTour(false);
    localStorage.setItem('hasSeenOnboardingTour', 'true');
    setHasSeenTour(true);
  };

  const handleStartTour = () => {
    setShowTour(true);
  };

  const handleUploadComplete = (sectionNumber: string, fileName: string) => {
    console.log('[v0] PDF uploaded:', fileName, 'Section:', sectionNumber);

    // Create new section from uploaded PDF
    const newSection: Section = {
      id: `uploaded-${Date.now()}`,
      number: sectionNumber,
      title: fileName.replace('.pdf', ''),
      parentSection: sectionNumber.split('.').slice(0, -1).join('.'),
      isRequired: false,
      status: 'draft',
      isCategory: false,
      isUserAdded: false,
    };

    setSectionData((prev) => [...prev, newSection]);
  };

  const handleDeleteSubsection = (subsectionId: string) => {
    console.log('[v0] Deleting subsection:', subsectionId);

    if (!selectedSection) return;
    setSectionData((prevSections) =>
      prevSections.map((section) => {
        if (section.id === selectedSection.id) {
          // Helper function to recursively remove subsection
          const removeSubsectionRecursive = (
            subs: SubsectionContent[],
          ): SubsectionContent[] => {
            return subs
              .filter((sub) => sub.id !== subsectionId)
              .map((sub) => ({
                ...sub,
                subsections: sub.subsections
                  ? removeSubsectionRecursive(sub.subsections)
                  : undefined,
              }));
          };

          return {
            ...section,
            subsections: removeSubsectionRecursive(section.subsections || []),
          };
        }
        return section;
      }),
    );

    // If the deleted subsection was selected, clear the selection
    if (selectedSubsection?.id === subsectionId) {
      setSelectedSubsection(null);
    }
  };

  const handleReorderSubsections = (
    draggedId: string,
    targetId: string,
    parentId: string | null,
  ) => {
    console.log(
      '[v0] Reordering:',
      draggedId,
      'to',
      targetId,
      'parent:',
      parentId,
    );

    if (!selectedSection) return;
    setSectionData((prevSections) =>
      prevSections.map((section) => {
        if (section.id === selectedSection.id) {
          // Helper function to reorder subsections recursively
          const reorderSubsectionsRecursive = (
            subs: SubsectionContent[],
          ): SubsectionContent[] => {
            // Find the dragged and target items
            const draggedIndex = subs.findIndex((s) => s.id === draggedId);
            const targetIndex = subs.findIndex((s) => s.id === targetId);

            // If both found at this level, reorder them
            if (draggedIndex !== -1 && targetIndex !== -1) {
              const newSubs = [...subs];
              const [draggedItem] = newSubs.splice(draggedIndex, 1);
              newSubs.splice(targetIndex, 0, draggedItem);
              return newSubs;
            }

            // Otherwise, recurse into nested subsections
            return subs.map((sub) => ({
              ...sub,
              subsections: sub.subsections
                ? reorderSubsectionsRecursive(sub.subsections)
                : undefined,
            }));
          };

          return {
            ...section,
            subsections: reorderSubsectionsRecursive(section.subsections || []),
          };
        }
        return section;
      }),
    );
  };

  return (
    <div className='flex h-full w-full bg-background overflow-hidden'>
      <Sidebar
        sections={sectionData}
        selectedSection={selectedSection ?? sectionData[0] ?? ({} as Section)}
        selectedSubsection={selectedSubsection}
        onSelectSection={handleSelectSection}
        onSelectSubsection={handleSelectSubsection}
        onUploadPdf={() => setShowUploadDialog(true)}
        onAddFromTemplate={() => setShowAddFromTemplate(true)}
        onReorderSubsections={handleReorderSubsections}
      />
      <div className='flex-1 flex flex-col relative'>
        {isLoadingTree && !usedCachedTree && (
          <div className='absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            <p className='mt-3 text-sm text-muted-foreground'>
              Loading section tree…
            </p>
          </div>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='absolute top-4 right-4 z-10'
                onClick={handleStartTour}
                title='Show Tutorial'
              >
                <HelpCircle className='h-5 w-5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Show Tutorial</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {treeError && (
          <div className='mx-6 mt-6 rounded-md border border-amber-300 bg-amber-50 text-amber-900 px-4 py-2 text-sm flex items-center justify-between gap-4'>
            <span>{treeError}</span>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setTreeRetryKey((k) => k + 1)}
              >
                Retry
              </Button>
            </div>
          </div>
        )}
        {isLoadingTree ? (
          <div className='p-6 space-y-3'>
            <div className='h-7 w-64 rounded bg-muted animate-pulse' />
            <div className='h-4 w-80 rounded bg-muted animate-pulse' />
            <div className='h-[520px] w-full rounded bg-muted animate-pulse' />
          </div>
        ) : selectedSubsection && !selectedSubsection.isCategory ? (
          <div className='p-6 space-y-4'>
            {fileLoading && (
              <div className='space-y-2'>
                <div className='h-6 w-64 rounded bg-muted animate-pulse' />
                <div className='h-4 w-48 rounded bg-muted animate-pulse' />
              </div>
            )}
            {fileError && (
              <div className='rounded border border-amber-300 bg-amber-50 text-amber-900 px-4 py-2 text-sm'>
                {fileError}
              </div>
            )}
            {fileMode === 'md' && fileText && (
              <div className='h-[80vh] overflow-y-auto rounded-md border border-border bg-card p-4 space-y-4'>
                <div className='border-b border-border pb-3'>
                  <div className='flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-3 flex-wrap'>
                      <Badge
                        variant='outline'
                        className='font-mono text-xs px-2 py-1'
                      >
                        1 of 1
                      </Badge>
                      <span className='text-base font-semibold text-foreground'>
                        {selectedSubsection?.title}
                      </span>
                      <Badge className='bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'>
                        Draft
                      </Badge>
                    </div>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <Button variant='outline' size='sm' className='text-xs'>
                        View &amp; Edit Template
                      </Button>
                      <Button variant='outline' size='sm' className='text-xs'>
                        Materials (0)
                      </Button>
                    </div>
                  </div>
                </div>
                <TiptapEditor
                  key={selectedSubsection?.id}
                  content={markdownToHtml(fileText)}
                  onChange={() => {}}
                  readOnly={false}
                  hideToolbar={false}
                  sectionNumber={
                    toSectionNumber(selectedSubsection?.subsectionNumber) ||
                    toSectionNumber(selectedSection?.number) ||
                    selectedSubsection?.subsectionNumber
                  }
                />
              </div>
            )}
            {fileMode === 'pdf' && fileUrl && (
              <div className='rounded-md border border-border overflow-hidden'>
                <iframe
                  src={fileUrl}
                  className='w-full h-[80vh] border-0'
                  title='PDF Preview'
                />
              </div>
            )}
          </div>
        ) : (
          selectedSection && (
            <SectionEditor
              section={selectedSection}
              selectedSubsection={selectedSubsection}
              onAddSubsection={handleAddSubsection}
              onDeleteSubsection={handleDeleteSubsection}
            />
          )
        )}
      </div>
      <OnboardingTour isOpen={showTour} onClose={handleCloseTour} />
      <PdfUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onUploadComplete={handleUploadComplete}
        company={companyValue}
        projectName={projectNameValue}
      />
      <AddFromTemplateDialog
        open={showAddFromTemplate}
        onOpenChange={setShowAddFromTemplate}
        onCreate={handleCreateFromTemplate}
        projectId={selectedProjectId}
        company={companyValue}
        projectName={projectNameValue}
        s3Key={primaryS3Key}
      />
    </div>
  );
}

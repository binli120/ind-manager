// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
'use client';

import { OnboardingTour } from '@/components/section-editor/onboarding-tour';
import { PdfUploadDialog } from '@/components/section-editor/pdf-upload-dialog';
import { SectionEditor } from '@/components/section-editor/section-editor';
import { Sidebar } from '@/components/section-editor/sidebar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Section, SubsectionContent } from '@/types/section';

const sections: Section[] = [
  {
    id: '2.4.1',
    number: '2.4.1',
    title: 'Overview of the Nonclinical Development Strategy',
    parentSection: '2.4',
    isRequired: true,
    status: 'draft',
    isCategory: true,
    isUserAdded: false,
    subsections: [
      {
        id: '2.4.1.1',
        subsectionNumber: '2.4.1.1',
        title: 'High-Level Overview of the Nonclinical Development Strategy',
        header: 'High-Level Overview of the Nonclinical Development Strategy',
        content: '',
        isRequired: true,
        status: 'draft',
        isCategory: true,
        subsections: [
          {
            id: '2.4.1.1-a',
            subsectionNumber: '2.4.1.1-a',
            title: 'High-Level Summary of the Nonclinical Program',
            header: 'High-Level Summary of the Nonclinical Program',
            content: `The nonclinical development program for XYZ-123 was designed to support the proposed Phase 1 first-in-human clinical trial in patients with advanced solid tumors. The program encompasses a comprehensive evaluation of the pharmacological, pharmacokinetic, and toxicological properties of XYZ-123, a novel small molecule kinase inhibitor.

Key components of the nonclinical program include:

Primary pharmacodynamic studies demonstrated potent and selective inhibition of the target kinase with an IC50 of 2.3 nM in biochemical assays. Secondary pharmacology studies revealed no significant off-target activity at concentrations up to 100-fold above the primary target IC50.`,
            isRequired: true,
            status: 'draft',
            isUserAdded: false,
          },
          {
            id: '2.4.1.1-b',
            subsectionNumber: '2.4.1.1-b',
            title: 'Pharmacology Summary',
            header: 'Pharmacology Summary',
            content: `Pharmacokinetic studies in both rodent and non-rodent species showed dose-proportional exposure with moderate clearance and good oral bioavailability (45-60% across species). The elimination half-life ranged from 3-6 hours, supporting once or twice daily dosing regimens.`,
            isRequired: false,
            status: 'draft',
            isUserAdded: false,
          },
          {
            id: '2.4.1.1-c',
            subsectionNumber: '2.4.1.1-c',
            title: 'Toxicology Overview',
            header: 'Toxicology Overview',
            content: `Toxicology studies were conducted in accordance with ICH guidelines and included general toxicity studies, safety pharmacology assessments, and genotoxicity evaluations.`,
            isRequired: true,
            status: 'draft',
            isUserAdded: false,
          },
          {
            id: '2.4.1.1-d',
            subsectionNumber: '2.4.1.1-d',
            title: 'ADME Studies',
            header: 'ADME Studies',
            content: `Absorption, distribution, metabolism, and excretion (ADME) studies demonstrated favorable drug-like properties with good permeability and metabolic stability.`,
            isRequired: false,
            status: 'draft',
            isUserAdded: false,
          },
          {
            id: '2.4.1.1-e',
            subsectionNumber: '2.4.1.1-e',
            title: 'Safety Pharmacology',
            header: 'Safety Pharmacology',
            content: `Safety pharmacology studies evaluated the effects on vital organ systems including cardiovascular, respiratory, and central nervous systems.`,
            isRequired: false,
            status: 'draft',
            isUserAdded: false,
          },
        ],
      },
    ],
  },
  {
    id: '2.4.2',
    number: '2.4.2',
    title: 'Pharmacology',
    parentSection: '2.4',
    isRequired: true,
    status: 'draft',
    isCategory: false,
    isUserAdded: false,
  },
  {
    id: '2.4.3',
    number: '2.4.3',
    title: 'Pharmacology and Toxicology',
    parentSection: '2.4',
    isRequired: true,
    status: 'draft',
    isCategory: false,
    isUserAdded: false,
  },
  {
    id: '2.4.4',
    number: '2.4.4',
    title: 'Toxicology',
    parentSection: '2.4',
    isRequired: true,
    status: 'draft',
    isCategory: false,
    isUserAdded: false,
  },
  {
    id: '2.5',
    number: '2.5',
    title: 'Clinical Data',
    parentSection: '2',
    isRequired: false,
    status: 'draft',
    isCategory: false,
    isUserAdded: false,
  },
  {
    id: '2.6',
    number: '2.6',
    title: 'Nonclinical Written and Tabulated Summaries',
    parentSection: '2',
    isRequired: true,
    status: 'draft',
    isCategory: true,
    isUserAdded: false,
    subsections: [
      {
        id: '2.6-a',
        subsectionNumber: '2.6.1',
        title: 'Introduction',
        header: 'Introduction',
        content: `This section provides written and tabulated summaries of nonclinical studies conducted to support the clinical development of XYZ-123.`,
        isRequired: true,
        status: 'draft',
        isUserAdded: false,
      },
      {
        id: '2.6-b',
        subsectionNumber: '2.6.2',
        title: 'Pharmacology Written Summary',
        header: 'Pharmacology Written Summary',
        content: `Comprehensive summary of pharmacology studies including primary and secondary pharmacodynamics and safety pharmacology.`,
        isRequired: true,
        status: 'draft',
        isUserAdded: false,
      },
      {
        id: '2.6-c',
        subsectionNumber: '2.6.3',
        title: 'Pharmacology Tabulated Summary',
        header: 'Pharmacology Tabulated Summary',
        content: `Tabulated overview of key pharmacology study results and findings.`,
        isRequired: true,
        status: 'draft',
        isCategory: true,
        subsections: [
          {
            id: '2.6.3.1',
            subsectionNumber: '2.6.3.1',
            title: 'Pharmacology: Overview',
            header: 'Pharmacology: Overview',
            content: '',
            isRequired: true,
            status: 'draft',
            isUserAdded: false,
          },
        ],
      },
      {
        id: '2.6-d',
        subsectionNumber: '2.6.4',
        title: 'Toxicology Written Summary',
        header: 'Toxicology Written Summary',
        content: `Detailed written summary of toxicology studies including single-dose, repeat-dose, and specialized toxicity studies.`,
        isRequired: true,
        status: 'draft',
        isUserAdded: false,
      },
      {
        id: '2.6-e',
        subsectionNumber: '2.6.5',
        title: 'Toxicology Tabulated Summary',
        header: 'Toxicology Tabulated Summary',
        content: `Tabulated summary of toxicology findings across all studies.`,
        isRequired: true,
        status: 'draft',
        isUserAdded: false,
      },
    ],
  },
];

export function SmartEditorView() {
  const [sectionData, setSectionData] = useState<Section[]>(sections);
  const [selectedSection, setSelectedSection] = useState<Section>(
    sectionData[0]
  );
  const [selectedSubsection, setSelectedSubsection] =
    useState<SubsectionContent | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useLocalStorage<boolean>(
    'hasSeenOnboardingTour',
    false
  );

  useEffect(() => {
    if (!hasSeenTour) {
      setShowTour(true);
    }
  }, [hasSeenTour]);

  useEffect(() => {
    const updatedSection = sectionData.find((s) => s.id === selectedSection.id);
    if (updatedSection) {
      setSelectedSection(updatedSection);
    }
  }, [sectionData, selectedSection.id]);

  const handleSelectSection = (section: Section) => {
    if (!section.isCategory) {
      setSelectedSection(section);
      setSelectedSubsection(null);
    }
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

    if (parentSection && parentSection.id !== selectedSection.id) {
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

    setSectionData((prevSections) =>
      prevSections.map((section) => {
        if (section.id === selectedSection.id) {
          // Helper function to recursively add subsection to the correct parent
          const addSubsectionRecursive = (
            subs: SubsectionContent[]
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
      })
    );

    if (shouldUpdateSelection && newParentSubsection) {
      setTimeout(() => {
        setSelectedSubsection(newParentSubsection);
        setTimeout(() => {
          const element = document.getElementById(
            `section-${subsectionNumber}`
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

    setSectionData((prevSections) =>
      prevSections.map((section) => {
        if (section.id === selectedSection.id) {
          // Helper function to recursively remove subsection
          const removeSubsectionRecursive = (
            subs: SubsectionContent[]
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
      })
    );

    // If the deleted subsection was selected, clear the selection
    if (selectedSubsection?.id === subsectionId) {
      setSelectedSubsection(null);
    }
  };

  const handleReorderSubsections = (
    draggedId: string,
    targetId: string,
    parentId: string | null
  ) => {
    console.log(
      '[v0] Reordering:',
      draggedId,
      'to',
      targetId,
      'parent:',
      parentId
    );

    setSectionData((prevSections) =>
      prevSections.map((section) => {
        if (section.id === selectedSection.id) {
          // Helper function to reorder subsections recursively
          const reorderSubsectionsRecursive = (
            subs: SubsectionContent[]
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
      })
    );
  };

  return (
    <div className='flex h-full w-full bg-background overflow-hidden'>
      <Sidebar
        sections={sectionData}
        selectedSection={selectedSection}
        selectedSubsection={selectedSubsection}
        onSelectSection={handleSelectSection}
        onSelectSubsection={handleSelectSubsection}
        onUploadPdf={() => setShowUploadDialog(true)}
        onReorderSubsections={handleReorderSubsections}
      />
      <div className='flex-1 flex flex-col relative'>
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
        <SectionEditor
          section={selectedSection}
          selectedSubsection={selectedSubsection}
          onAddSubsection={handleAddSubsection}
          onDeleteSubsection={handleDeleteSubsection}
        />
      </div>
      <OnboardingTour isOpen={showTour} onClose={handleCloseTour} />
      <PdfUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}

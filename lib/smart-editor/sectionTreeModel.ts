// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import type { Section, SubsectionContent } from "@/types/section";

const cloneSubsection = (subsection: SubsectionContent): SubsectionContent => ({
  ...subsection,
  subsections: subsection.subsections
    ? subsection.subsections.map(cloneSubsection)
    : undefined,
});

const appendToCategory = ({
  subsections,
  targetCategoryId,
  newSubsection,
}: {
  subsections: SubsectionContent[];
  targetCategoryId: string;
  newSubsection: SubsectionContent;
}): {
  subsections: SubsectionContent[];
  updatedCategory: SubsectionContent | null;
  found: boolean;
} => {
  let found = false;
  let updatedCategory: SubsectionContent | null = null;

  const nextSubsections = subsections.map((subsection) => {
    if (subsection.id === targetCategoryId) {
      found = true;
      updatedCategory = {
        ...subsection,
        subsections: [...(subsection.subsections ?? []), newSubsection],
      };
      return updatedCategory;
    }

    if (subsection.subsections?.length) {
      const childResult = appendToCategory({
        subsections: subsection.subsections,
        targetCategoryId,
        newSubsection,
      });

      if (childResult.found) {
        found = true;
        if (childResult.updatedCategory) {
          updatedCategory = childResult.updatedCategory;
        }
        return {
          ...subsection,
          subsections: childResult.subsections,
        };
      }
    }

    return subsection;
  });

  return {
    subsections: nextSubsections,
    updatedCategory,
    found,
  };
};

const appendSiblingToSelected = ({
  subsections,
  selectedSubsectionId,
  newSubsection,
}: {
  subsections: SubsectionContent[];
  selectedSubsectionId: string;
  newSubsection: SubsectionContent;
}): {
  subsections: SubsectionContent[];
  updatedParent: SubsectionContent | null;
  found: boolean;
} => {
  let found = false;
  let updatedParent: SubsectionContent | null = null;

  const nextSubsections = subsections.map((subsection) => {
    if (subsection.subsections?.some((sub) => sub.id === selectedSubsectionId)) {
      found = true;
      updatedParent = {
        ...subsection,
        subsections: [...(subsection.subsections ?? []), newSubsection],
      };
      return updatedParent;
    }

    if (subsection.subsections?.length) {
      const childResult = appendSiblingToSelected({
        subsections: subsection.subsections,
        selectedSubsectionId,
        newSubsection,
      });

      if (childResult.found) {
        found = true;
        if (childResult.updatedParent) {
          updatedParent = childResult.updatedParent;
        }
        return {
          ...subsection,
          subsections: childResult.subsections,
        };
      }
    }

    return subsection;
  });

  return {
    subsections: nextSubsections,
    updatedParent,
    found,
  };
};

const findSubsectionInTree = (
  subsections: SubsectionContent[],
  subsectionId: string,
): boolean =>
  subsections.some((subsection) => {
    if (subsection.id === subsectionId) return true;
    if (!subsection.subsections?.length) return false;
    return findSubsectionInTree(subsection.subsections, subsectionId);
  });

export const findParentSectionForSubsection = ({
  sections,
  subsectionId,
}: {
  sections: Section[];
  subsectionId: string;
}) =>
  sections.find((section) =>
    findSubsectionInTree(section.subsections ?? [], subsectionId),
  ) ?? null;

export const addSubsectionForSelection = ({
  sections,
  selectedSectionId,
  selectedSubsection,
  subsectionNumber,
  header,
  now = Date.now(),
}: {
  sections: Section[];
  selectedSectionId: string | null;
  selectedSubsection: SubsectionContent | null;
  subsectionNumber: string;
  header: string;
  now?: number;
}): {
  sections: Section[];
  nextSelectedSubsection: SubsectionContent | null;
} => {
  if (!selectedSectionId) {
    return {
      sections,
      nextSelectedSubsection: null,
    };
  }

  const newSubsection: SubsectionContent = {
    id: `new-${now}`,
    subsectionNumber,
    title: header,
    header,
    content: "",
    isRequired: false,
    status: "draft",
    isUserAdded: true,
  };

  let nextSelectedSubsection: SubsectionContent | null = null;

  const nextSections = sections.map((section) => {
    if (section.id !== selectedSectionId) return section;

    const currentSubsections = (section.subsections ?? []).map(cloneSubsection);

    if (!selectedSubsection) {
      return {
        ...section,
        subsections: [...currentSubsections, newSubsection],
      };
    }

    if (selectedSubsection.isCategory) {
      const categoryResult = appendToCategory({
        subsections: currentSubsections,
        targetCategoryId: selectedSubsection.id,
        newSubsection,
      });

      if (categoryResult.found) {
        nextSelectedSubsection = categoryResult.updatedCategory;
        return {
          ...section,
          subsections: categoryResult.subsections,
        };
      }

      return section;
    }

    const siblingResult = appendSiblingToSelected({
      subsections: currentSubsections,
      selectedSubsectionId: selectedSubsection.id,
      newSubsection,
    });

    if (siblingResult.found) {
      nextSelectedSubsection = siblingResult.updatedParent;
      return {
        ...section,
        subsections: siblingResult.subsections,
      };
    }

    return section;
  });

  return {
    sections: nextSections,
    nextSelectedSubsection,
  };
};

const removeSubsectionRecursive = (
  subsections: SubsectionContent[],
  subsectionId: string,
): SubsectionContent[] =>
  subsections
    .filter((subsection) => subsection.id !== subsectionId)
    .map((subsection) => ({
      ...subsection,
      subsections: subsection.subsections
        ? removeSubsectionRecursive(subsection.subsections, subsectionId)
        : undefined,
    }));

export const deleteSubsectionFromSection = ({
  sections,
  selectedSectionId,
  subsectionId,
}: {
  sections: Section[];
  selectedSectionId: string | null;
  subsectionId: string;
}) => {
  if (!selectedSectionId) return sections;

  return sections.map((section) =>
    section.id === selectedSectionId
      ? {
          ...section,
          subsections: removeSubsectionRecursive(
            section.subsections ?? [],
            subsectionId,
          ),
        }
      : section,
  );
};

const reorderSubsectionsRecursive = ({
  subsections,
  draggedId,
  targetId,
}: {
  subsections: SubsectionContent[];
  draggedId: string;
  targetId: string;
}): SubsectionContent[] => {
  const draggedIndex = subsections.findIndex((subsection) => subsection.id === draggedId);
  const targetIndex = subsections.findIndex((subsection) => subsection.id === targetId);

  if (draggedIndex !== -1 && targetIndex !== -1) {
    const nextSubsections = [...subsections];
    const [draggedSubsection] = nextSubsections.splice(draggedIndex, 1);
    nextSubsections.splice(targetIndex, 0, draggedSubsection);
    return nextSubsections;
  }

  return subsections.map((subsection) => ({
    ...subsection,
    subsections: subsection.subsections
      ? reorderSubsectionsRecursive({
          subsections: subsection.subsections,
          draggedId,
          targetId,
        })
      : undefined,
  }));
};

export const reorderSubsectionsInSection = ({
  sections,
  selectedSectionId,
  draggedId,
  targetId,
}: {
  sections: Section[];
  selectedSectionId: string | null;
  draggedId: string;
  targetId: string;
}) => {
  if (!selectedSectionId) return sections;

  return sections.map((section) =>
    section.id === selectedSectionId
      ? {
          ...section,
          subsections: reorderSubsectionsRecursive({
            subsections: section.subsections ?? [],
            draggedId,
            targetId,
          }),
        }
      : section,
  );
};

export const toRelativeS3Key = (uri: string) => {
  if (!uri.startsWith("s3://")) return uri;
  const parts = uri.replace("s3://", "").split("/");
  return parts.slice(1).join("/");
};

export const buildUploadedSection = ({
  sectionNumber,
  fileName,
  now = Date.now(),
}: {
  sectionNumber: string;
  fileName: string;
  now?: number;
}): Section => ({
  id: `uploaded-${now}`,
  number: sectionNumber,
  title: fileName.replace(".pdf", ""),
  parentSection: sectionNumber.split(".").slice(0, -1).join("."),
  isRequired: false,
  status: "draft",
  isCategory: false,
  isUserAdded: false,
});

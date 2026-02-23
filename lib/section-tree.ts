// Author: Bin Lee
// Email: binlee120@gmail.com

// Utility helpers for manipulating the section tree in-memory

import type { Section, SubsectionContent } from "@/types/section"

export interface UpsertSectionResult {
  sections: Section[]
  section: Section
  leaf: SubsectionContent
}

type SectionNormalized = Omit<Section, "subsections"> & { subsections: SubsectionNormalized[] }
type SubsectionNormalized = Omit<SubsectionContent, "subsections"> & { subsections: SubsectionNormalized[] }

const createSubsection = (number: string, isLeaf: boolean, now: number): SubsectionNormalized => ({
  id: `user-added-${number.replace(/\./g, "-")}-${now}`,
  subsectionNumber: number,
  title: isLeaf ? `Template ${number}` : `Section ${number}`,
  header: "",
  content: "",
  isRequired: false,
  status: "draft",
  isCategory: !isLeaf,
  subsections: [],
  isUserAdded: true,
})

const cloneSubsection = (sub: SubsectionContent): SubsectionNormalized => ({
  ...sub,
  subsections: sub.subsections ? sub.subsections.map(cloneSubsection) : [],
})

/**
 * Ensure the section tree contains the provided numeric path (e.g., "2.4.1.1")
 * and return updated tree plus the new/located leaf node.
 */
export const upsertSectionPath = (sections: Section[], targetNumber: string): UpsertSectionResult => {
  const cleanNumber = targetNumber.trim()
  if (!cleanNumber) {
    throw new Error("section number is required")
  }

  const segments = cleanNumber.split(".")
  const prefixes = segments.map((_, idx) => segments.slice(0, idx + 1).join("."))

  const matchScore = (sectionNumber: string) => {
    if (cleanNumber === sectionNumber) return sectionNumber.length
    if (cleanNumber.startsWith(`${sectionNumber}.`)) return sectionNumber.length
    return -1
  }

  let targetSectionIndex = -1
  let bestScore = -1
  sections.forEach((section, idx) => {
    const score = matchScore(section.number)
    if (score > bestScore) {
      bestScore = score
      targetSectionIndex = idx
    }
  })

  let nextSections: SectionNormalized[] = sections.map(
    (s) => ({ ...s, subsections: s.subsections ? s.subsections.map(cloneSubsection) : [] }) as SectionNormalized,
  )

  if (targetSectionIndex === -1) {
    const rootNumber = segments[0]
    const newSection: SectionNormalized = {
      id: `user-added-section-${rootNumber}-${Date.now()}`,
      number: rootNumber,
      title: `Section ${rootNumber}`,
      parentSection: rootNumber.split(".").slice(0, -1).join("."),
      isRequired: false,
      status: "draft",
      isCategory: true,
      isUserAdded: true,
      subsections: [],
    }
    nextSections = [...nextSections, newSection]
    targetSectionIndex = nextSections.length - 1
  }

  const now = Date.now()
  const targetSection = nextSections[targetSectionIndex]
  const path = prefixes.filter((p) => p !== targetSection.number)

  const upsertSubsections = (
    subs: SubsectionNormalized[],
    pathIdx: number,
  ): { subs: SubsectionNormalized[]; leaf: SubsectionNormalized } => {
    const prefix = path[pathIdx]
    if (!prefix) {
      // target number equals section number; add a direct child
      const leaf = createSubsection(cleanNumber, true, now)
      return { subs: [...subs, leaf], leaf }
    }

    const clonedSubs: SubsectionNormalized[] = subs.map((s) => ({
      ...s,
      subsections: s.subsections ? s.subsections.map(cloneSubsection) : [],
    }))

    let foundIndex = clonedSubs.findIndex((s) => s.subsectionNumber === prefix)
    if (foundIndex === -1) {
      const isLeaf = pathIdx === path.length - 1
      const newNode = createSubsection(prefix, isLeaf, now + pathIdx)
      clonedSubs.push(newNode)
      foundIndex = clonedSubs.length - 1
    }

    const node = clonedSubs[foundIndex]
    if (pathIdx === path.length - 1) {
      return { subs: clonedSubs, leaf: node }
    }

    const childSubs = node.subsections || []
    const { subs: updatedChildren, leaf } = upsertSubsections(childSubs, pathIdx + 1)
    clonedSubs[foundIndex] = { ...node, subsections: updatedChildren, isCategory: true }
    return { subs: clonedSubs, leaf }
  }

  const { subs, leaf } = upsertSubsections(targetSection.subsections || [], 0)
  const updatedSection: SectionNormalized = { ...targetSection, subsections: subs, isCategory: true }
  nextSections[targetSectionIndex] = updatedSection

  return {
    sections: nextSections,
    section: updatedSection,
    leaf,
  }
}

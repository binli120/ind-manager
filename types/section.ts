// Author: Bin Lee
// Email: binlee120@gmail.com
export interface SubsectionContent {
  id: string;
  subsectionNumber: string;
  title: string;
  header: string;
  content: string;
  isRequired: boolean;
  status: "draft" | "accepted";
  isCategory?: boolean;
  subsections?: SubsectionContent[];
  isUserAdded?: boolean;
  fullPath?: string;
  templateType?: "folder" | "file";
  description?: string;
  templateText?: string;
  templateDepth?: number;
}

export interface Section {
  id: string;
  number: string;
  title: string;
  parentSection: string;
  isRequired: boolean;
  status: "draft" | "accepted" | "in-review" | "approved";
  isCategory?: boolean;
  isUserAdded?: boolean;
  subsections?: SubsectionContent[];
  templateType?: "folder" | "file";
  description?: string;
  templateText?: string;
  templateDepth?: number;
}

export interface ModalityContent {
  sm: string; // Small Molecule
  bio: string; // Biologics
  adc: string; // Antibody-Drug Conjugate
  ont: string; // Oligonucleotide-Based Therapeutics
  other: string; // Other Modality
}

export interface TemplateRow {
  id: string;
  section: string;
  sectionHeader: string;
  subsection: string;
  subsectionHeader: string;
  subSectionNumbering: string;
  indRequirement: "Required" | "Optional" | "Not Applicable";
  content: string;
  modalities: ModalityContent;
  raw?: string;
}

export interface Template {
  id: string;
  name: string;
  type: "project" | "company";
  isDefault: boolean;
  rows: TemplateRow[];
  lastUpdated: string;
  canEdit: boolean;
}

// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

export type UserRole =
  | "reg_affairs_manager_lead"
  | "regulatory_writer_medical_writer"
  | "ectd_publishing_specialist"
  | "clinical_development_lead"
  | "medical_monitor"
  | "nonclinical_toxicology_lead"
  | "cmc_lead"
  | "quality_assurance"
  | "project_manager"
  | "data_manager_biostatistician"
  | "document_management_specialist";

export type UserPrivilege = "system_admin" | "user_manager" | "user";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  privilege?: UserPrivilege;
  password?: string;
  company: string;
  status: "active" | "inactive" | "pending";
};

export type Tenant = {
  id: string;
  name: string;
};

export type UserStatusFilter = "all" | "active" | "inactive" | "pending";

export type AddUserInput = Omit<User, "id" | "status" | "password"> & {
  privilege: UserPrivilege;
};

export type EditUserInput = Pick<
  User,
  "name" | "email" | "phone" | "role" | "company"
>;

export const roleLabels: Record<UserRole, string> = {
  reg_affairs_manager_lead: "Regulatory Affairs Manager/Lead",
  regulatory_writer_medical_writer: "Regulatory Writer/Medical Writer",
  ectd_publishing_specialist: "eCTD Publishing Specialist",
  clinical_development_lead: "Clinical Development Lead",
  medical_monitor: "Medical Monitor",
  nonclinical_toxicology_lead: "Nonclinical/Toxicology Lead",
  cmc_lead: "CMC Lead",
  quality_assurance: "Quality Assurance",
  project_manager: "Project Manager",
  data_manager_biostatistician: "Data Manager/Biostatistician",
  document_management_specialist: "Document Management Specialist",
};

export const coreRegulatoryRoles: UserRole[] = [
  "reg_affairs_manager_lead",
  "regulatory_writer_medical_writer",
  "ectd_publishing_specialist",
];

export const scientificClinicalRoles: UserRole[] = [
  "clinical_development_lead",
  "medical_monitor",
  "nonclinical_toxicology_lead",
  "cmc_lead",
];

export const supportingRoles: UserRole[] = [
  "quality_assurance",
  "project_manager",
  "data_manager_biostatistician",
  "document_management_specialist",
];

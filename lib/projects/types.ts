import type { Database } from "@/lib/supabase/schema";

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  name: string;
  avatar?: string | null;
  initials: string;
  role: "lead" | "member" | "viewer";
  joinedAt: string;
}

export interface Project {
  id: string;
  title: string;
  code: string;
  description: string;
  status:
    | "draft"
    | "pre-ind-meeting-requested"
    | "pre-ind-meeting-completed"
    | "submitted"
    | "under-review"
    | "active"
    | "clinical-hold-complete"
    | "clinical-hold-partial"
    | "inactive"
    | "withdrawn"
    | "terminated";
  priority: "low" | "medium" | "high" | "critical";
  progress: number;
  sponsor: string;
  drug: string;
  targetDate: string;
  tenantId: string;
  ownerId: string;
  teamSize: number;
  teamMembers: ProjectMember[];
  createdAt: string;
  updatedAt: string;
  settings: {
    isPublic: boolean;
    allowCollaboration: boolean;
  };
  metadata?: {
    phase?: string;
    indication?: string;
    studyType?: string;
    regulatoryPath?: string;
    team_assignments?: {
      tech_writer?: string;
      ind_writer?: string;
      inc_writer?: string;
    };
  };
  targetIndSubmissionDate: string;
  preIndMeetingDate: string | null;
  projectStartDate: string;
  fdaContactEmail: string | null;
  sponsorContactEmail: string;
  additionalNotes: string | null;
  productType: string;
  cmcLead?: string | null;
  clinicalLead?: string | null;
  preclinicalLead?: string | null;
  regulatoryOwner?: string | null;
  publisher?: string | null;
  techWriter?: string | null;
  indWriter?: string | null;
  userRole?: Database["public"]["Enums"]["user_roles"] | null;
}

export type ProjectCreation =
  Database["public"]["Tables"]["projects"]["Insert"];

export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

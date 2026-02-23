// Author: Bin Lee
// Email: binlee120@gmail.com
import { NextResponse, type NextRequest } from "next/server";
import type { Project, ProjectMember } from "@/lib/store/slices";
import mockProjects from "@/mock/data/projects.json";

const rawProjects = mockProjects as Array<Partial<Project>>;

const projects: Project[] = rawProjects.map((p, idx) => ({
  id: p.id ?? `mock-project-${idx}`,
  title: p.title ?? "Untitled Project",
  code: p.code ?? `MOCK-${idx}`,
  description: p.description ?? "No description available",
  status: (p.status as Project["status"]) ?? "draft",
  priority: (p.priority as Project["priority"]) ?? "low",
  progress: p.progress ?? 0,
  sponsor: p.sponsor ?? "",
  drug: p.drug ?? "",
  targetDate: p.targetDate ?? "",
  tenantId: (p.tenantId as string | undefined) ?? "demo-tenant",
  ownerId: p.ownerId ?? "",
  teamSize: p.teamSize ?? (p.teamMembers?.length ?? 0),
  teamMembers: (p.teamMembers || []).map((m, mIdx) => ({
    id: m.id ?? `mock-member-${idx}-${mIdx}`,
    userId: m.userId ?? "",
    projectId: m.projectId ?? (p.id ?? `mock-project-${idx}`),
    name: m.name ?? "Member",
    avatar: m.avatar ?? null,
    initials: m.initials ?? "MM",
    role: (m.role as ProjectMember["role"]) ?? "member",
    joinedAt: m.joinedAt ?? new Date().toISOString(),
  })),
  createdAt: p.createdAt ?? new Date().toISOString(),
  updatedAt: p.updatedAt ?? new Date().toISOString(),
  settings:
    (p.settings as Project["settings"]) ?? {
      isPublic: false,
      allowCollaboration: true,
    },
  metadata: (p.metadata as Project["metadata"]) ?? {},
  targetIndSubmissionDate: p.targetIndSubmissionDate ?? "",
  preIndMeetingDate: p.preIndMeetingDate ?? null,
  projectStartDate: p.projectStartDate ?? "",
  fdaContactEmail: p.fdaContactEmail ?? null,
  sponsorContactEmail: p.sponsorContactEmail ?? "",
  additionalNotes: p.additionalNotes ?? null,
  productType: p.productType ?? "",
}));

/** MOCK: Remove this mock endpoint when Supabase projects are live. */
export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenantId");
  const data = tenantId ? projects.filter((p) => p.tenantId === tenantId) : projects;
  return NextResponse.json({ data });
}

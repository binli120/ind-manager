// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { NextResponse, type NextRequest } from "next/server";
import type { Project } from "@/lib/store/slices";
import mockProjects from "@/mock/data/projects.json";

const projects = mockProjects as Project[];

/** MOCK: Remove this mock endpoint when Supabase projects are live. */
export async function GET(request: NextRequest) {
  const teamId = request.nextUrl.searchParams.get("teamId");
  const data = teamId ? projects.filter((p) => p.teamId === teamId) : projects;
  return NextResponse.json({ data });
}

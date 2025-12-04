import { Tenant } from "@/components/ui/tenants/tenants-page";

export async function fetchTenants(): Promise<Tenant[]> {
  const res = await fetch("/api/database", {
    method: "POST",
    body: JSON.stringify({
      table: "tenants",
      action: "select",
      data: { select: "*" },
    }),
  });

  const { data } = await res.json();

  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    companyAddress: row.address ?? "",
    contactPerson: row.contact_person ?? "",
    contactEmail: row.contact_email ?? "",
    contactPhone: row.contact_number?.toString() ?? "",
    status: row.status,
  }));
}
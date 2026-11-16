import { cache } from "react";
import { getHeadquartersOffice, offices, type Office } from "@/data/offices";

const editableFields = ["street", "postalCode", "city", "phone"] as const;

export const getWebsiteOffices = cache(async (): Promise<readonly Office[]> => {
  const baseUrl = process.env.CRM_API_URL?.trim();
  if (!baseUrl) return offices;
  try {
    const url = new URL("/api/public/offices", baseUrl);
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return offices;
    const rows: unknown = await response.json();
    if (!Array.isArray(rows)) return offices;
    return offices.map((office) => {
      const row = rows.find((item) => item && item.id === office.id);
      if (!row || !editableFields.every((field) => typeof row[field] === "string")) return office;
      const phone = row.phone.trim();
      const tel = phone.replace(/[^+\d]/g, "");
      return {
        ...office,
        street: row.street.trim() || null,
        postalCode: row.postalCode.trim() || null,
        city: row.city.trim() || null,
        phone: /^\+?\d{5,}$/.test(tel) ? { display: phone, tel } : null,
      };
    });
  } catch {
    return offices;
  }
});

export async function getWebsiteHeadquarters() {
  return (await getWebsiteOffices()).find((office) => office.hq) ?? getHeadquartersOffice();
}

import type { ProfileInfo } from "@/lib/types";

export const APP_NAME = "Smart Kos Energi";
export const APP_GROUP = "G3";

export const DEMO_PROFILE: ProfileInfo = {
  id: "demo-owner",
  fullName: "Bu Suwanti",
  role: "Pemilik Kos",
  kosName: "Kos Melati Harmoni",
  phone: "0812-3456-7890",
};

export function getInitials(name: string): string {
  return name
    .replace(/^Bu\s+|^Pak\s+|^Mas\s+|^Mbak\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

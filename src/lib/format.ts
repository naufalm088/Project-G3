import type { StatusTone } from "@/lib/types";

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatRupiah(value: number): string {
  if (!Number.isFinite(value)) return "Rp -";
  return rupiahFormatter.format(Math.round(value)).replace(/\u00A0/g, " ");
}

export function formatRupiahShort(value: number): string {
  if (!Number.isFinite(value)) return "Rp -";
  if (Math.abs(value) >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  }
  if (Math.abs(value) >= 1_000) {
    return `Rp ${(value / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} rb`;
  }
  return formatRupiah(value);
}

export function formatNumber(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "-";
  return `${formatNumber(value, digits)}%`;
}

export function formatPeriod(period: string): string {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return `${months[month - 1]} ${year}`;
}

export function formatRelativeDays(days: number): string {
  if (days === 0) return "hari ini";
  if (days === 1) return "besok";
  if (days === -1) return "kemarin";
  if (days > 0) return `${days} hari lagi`;
  return `${Math.abs(days)} hari lalu`;
}

export function statusToneForPayment(status: "pending" | "paid" | "overdue" | "none"): StatusTone {
  switch (status) {
    case "paid":
      return "safe";
    case "pending":
      return "warn";
    case "overdue":
      return "danger";
    default:
      return "neutral";
  }
}

export function statusToneForRoom(status: "occupied" | "vacant" | "maintenance"): StatusTone {
  switch (status) {
    case "occupied":
      return "safe";
    case "vacant":
      return "neutral";
    case "maintenance":
      return "warn";
    default:
      return "neutral";
  }
}

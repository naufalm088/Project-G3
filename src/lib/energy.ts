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
    return `Rp ${(value / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} jt`;
  }
  if (Math.abs(value) >= 1_000) {
    return `Rp ${(value / 1_000).toLocaleString("id-ID", {
      maximumFractionDigits: 0,
    })} rb`;
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

export function formatKwh(value: number, digits = 1): string {
  return `${formatNumber(value, digits)} kWh`;
}

export function formatVolt(value: number | null, digits = 1): string {
  return value == null ? "-" : `${formatNumber(value, digits)}`;
}

export function formatAmpere(value: number | null, digits = 1): string {
  return value == null ? "-" : `${formatNumber(value, digits)}`;
}

export function computePower(voltage: number, current: number, powerFactor = 1): number {
  return voltage * current * powerFactor;
}

export function computeEnergyKwh(powerWatt: number, durationHours: number): number {
  return (powerWatt * durationHours) / 1000;
}

export function computeCost(kwh: number, tariffPerKwh: number): number {
  return kwh * tariffPerKwh;
}

export function classifyRatio(
  ratioPercent: number,
  warnThreshold = 75,
  dangerThreshold = 95,
): StatusTone {
  if (!Number.isFinite(ratioPercent)) return "neutral";
  if (ratioPercent >= dangerThreshold) return "danger";
  if (ratioPercent >= warnThreshold) return "warn";
  return "safe";
}

export function statusLabelFromTone(tone: StatusTone): string {
  switch (tone) {
    case "safe":
      return "AMAN";
    case "warn":
      return "WASPADA";
    case "danger":
      return "BAHAYA";
    default:
      return "TIDAK DIKETAHUI";
  }
}

export function statusDescriptionFromTone(tone: StatusTone): string {
  switch (tone) {
    case "safe":
      return "Pemakaian masih terkendali di bawah batas anggaran.";
    case "warn":
      return "Pemakaian mendekati batas anggaran. Pantau perangkat berdaya besar.";
    case "danger":
      return "Pemakaian telah melampaui ambang batas. Segera lakukan penghematan.";
    default:
      return "Status pemakaian belum dapat ditentukan.";
  }
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "-";
  return `${formatNumber(value, digits)}%`;
}

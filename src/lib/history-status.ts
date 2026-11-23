import { formatKwh } from "@/lib/energy";
import type { HistoryDay, StatusTone } from "@/lib/types";

export type HistoryDayStatus = {
  label: string;
  tone: StatusTone;
  description: string;
};

export function historyDayStatus(day: HistoryDay, targetKwh: number): HistoryDayStatus {
  if (day.isMissing) {
    return { label: "BELUM ADA", tone: "neutral", description: "Data sensor belum tersedia" };
  }
  if (targetKwh <= 0) {
    return { label: "TERCATAT", tone: "neutral", description: "Target harian belum diatur" };
  }

  const diff = day.kwh - targetKwh;
  const ratio = day.kwh / targetKwh;

  if (ratio > 1.1) {
    return {
      label: "WASPADA",
      tone: "warn",
      description: `+${formatKwh(diff, 1)} di atas target`,
    };
  }
  if (ratio >= 0.95) {
    return { label: "PAS TARGET", tone: "neutral", description: "Optimal sesuai target harian" };
  }
  return {
    label: "HEMAT",
    tone: "safe",
    description: `-${formatKwh(Math.abs(diff), 1)} di bawah target`,
  };
}

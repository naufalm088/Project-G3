"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { PageContainer } from "@/components/layout/page-container";
import { useAppData } from "@/components/providers/app-data-provider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MaterialIcon } from "@/components/ui/material-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  dayName,
  dayShortName,
  formatDateShort,
  fromDateKey,
} from "@/lib/date";
import { formatKwh, formatPercent, formatRupiah } from "@/lib/energy";
import { downloadHistoryCsv, downloadHistoryPdf } from "@/lib/export";
import { historyDayStatus } from "@/lib/history-status";
import {
  HISTORY_RANGE_OPTIONS,
  selectHistory,
  type HistoryRange,
} from "@/lib/selectors";
import type { HistoryDay, HistoryView, StatusTone } from "@/lib/types";
import { cn } from "@/lib/utils";

const badgeStyles: Record<StatusTone, string> = {
  safe: "bg-safe-tint text-safe-text",
  warn: "bg-warn-tint text-warn-text",
  danger: "bg-danger-tint text-danger-text",
  neutral: "bg-surface-container-high text-on-surface-variant",
};

const dayTileStyles: Record<StatusTone, string> = {
  safe: "bg-safe-tint text-safe-text",
  warn: "bg-warn-tint text-warn-text",
  danger: "bg-danger-tint text-danger-text",
  neutral: "bg-surface-container-high text-on-surface-variant",
};

function barColor(day: HistoryDay, targetKwh: number): string {
  if (day.isMissing) return "#d3e4fe";
  if (day.isToday) return "#00855b";
  const ratio = targetKwh > 0 ? day.kwh / targetKwh : 0;
  if (ratio > 1.1) return "#ef4444";
  if (ratio >= 0.95) return "#f59e0b";
  return "#00685f";
}

function Inspector({ day, targetKwh }: { day: HistoryDay; targetKwh: number }) {
  const status = historyDayStatus(day, targetKwh);

  return (
    <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-surface-container-low p-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-primary">
          <MaterialIcon name="calendar_today" className="text-[18px]" />
        </div>
        <div className="min-w-0">
          <span className="block truncate font-headline-md text-body-sm font-bold text-on-surface">
            {dayName(fromDateKey(day.date))}, {formatDateShort(fromDateKey(day.date))}
            {day.isToday ? " (Hari ini)" : ""}
          </span>
          <span
            className={cn(
              "font-body-sm text-[11px] font-medium",
              status.tone === "warn" && "text-warn-text",
              status.tone === "danger" && "text-danger-text",
              status.tone === "safe" && "text-tertiary",
              status.tone === "neutral" && "text-on-surface-variant",
            )}
          >
            {status.description}
          </span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <span className="block font-mono text-body-lg font-bold text-on-surface">
          {day.isMissing ? "-" : formatKwh(day.kwh, 1)}
        </span>
        <span className="font-mono text-body-sm font-semibold text-primary">
          {day.isMissing ? "Belum ada data" : formatRupiah(day.rupiah)}
        </span>
      </div>
    </div>
  );
}

function RangeTabs({
  value,
  onChange,
}: {
  value: HistoryRange;
  onChange: (range: HistoryRange) => void;
}) {
  return (
    <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-xl bg-surface-container-low p-1">
      {HISTORY_RANGE_OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              "flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center font-body-sm text-body-sm transition-all",
              active
                ? "bg-surface-container-lowest font-semibold text-primary shadow-soft"
                : "font-medium text-on-surface-variant hover:text-on-surface",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function HistoryContent({
  history,
  range,
  kosName,
  onRangeChange,
}: {
  history: HistoryView;
  range: HistoryRange;
  kosName: string;
  onRangeChange: (range: HistoryRange) => void;
}) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const selected =
    history.days.find((day) => day.date === selectedDate) ??
    history.days[history.days.length - 1] ??
    null;

  const chartData = history.days.map((day) => ({
    ...day,
    label: dayShortName(fromDateKey(day.date)),
  }));

  const targetKwh = history.dailyTargetKwh;
  const avgVsTarget = targetKwh > 0 ? (history.averageKwh / targetKwh - 1) * 100 : 0;
  const averageBadge =
    avgVsTarget <= 0
      ? { text: `Hemat ${formatPercent(Math.abs(avgVsTarget), 0)}`, tone: "safe" as StatusTone }
      : { text: `Boros ${formatPercent(avgVsTarget, 0)}`, tone: "warn" as StatusTone };

  const detailDays = history.days.slice().reverse();

  function handleExport(kind: "pdf" | "csv") {
    try {
      if (kind === "pdf") {
        downloadHistoryPdf(history, kosName);
      } else {
        downloadHistoryCsv(history, kosName);
      }
      toast({
        title: kind === "pdf" ? "Laporan PDF berhasil diunduh" : "Data CSV berhasil diunduh",
        description:
          kind === "pdf"
            ? `Rekap ${history.rangeLabel} siap disimpan untuk pembukuan kos.`
            : "Buka file CSV di Excel/Google Sheets untuk mengolah tagihan.",
        tone: "success",
      });
    } catch (error) {
      toast({
        title: "Gagal membuat laporan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan tak terduga.",
        tone: "error",
      });
    }
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold tracking-tight text-on-surface">
            Riwayat &amp; Tren
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Monitoring energi kos Anda
          </span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container shadow-soft">
          <MaterialIcon name="insights" className="text-[22px]" />
        </div>
      </div>

      <RangeTabs value={range} onChange={onRangeChange} />

      <div className="grid grid-cols-2 gap-gutter-sm">
        <Card className="col-span-2 flex flex-col gap-space-sm overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-label-status text-label-status uppercase tracking-wider text-on-surface-variant">
              Rata-rata Pemakaian
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label-status text-label-status font-bold",
                badgeStyles[averageBadge.tone],
              )}
            >
              <MaterialIcon
                name={averageBadge.tone === "safe" ? "trending_down" : "trending_up"}
                className="text-[14px]"
              />
              {averageBadge.text}
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-metric-currency text-on-surface">
                {formatKwh(history.averageKwh, 1).replace(" kWh", "")}
              </span>
              <span className="font-body-sm text-body-sm font-bold text-on-surface-variant">
                kWh / hari
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono text-body-md font-bold text-primary">
                ~{formatRupiah(history.averageRupiah)}
              </span>
              <span className="block font-body-sm text-[11px] text-on-surface-variant">
                estimasi / hari
              </span>
            </div>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
            <div
              className={cn(
                "h-full rounded-full",
                avgVsTarget <= 0 ? "bg-primary" : "bg-warn",
              )}
              style={{
                width: `${Math.min(100, Math.max(4, targetKwh > 0 ? (history.averageKwh / targetKwh) * 100 : 0))}%`,
              }}
            />
          </div>
          <span className="mt-0.5 flex items-center gap-1 font-body-sm text-[11px] text-on-surface-variant">
            <MaterialIcon name="verified" className="text-[13px] text-tertiary" />
            Target maks: {formatKwh(targetKwh, 1)} / hari • {history.rangeLabel}
          </span>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-status text-label-status uppercase text-on-surface-variant">
              Puncak Tertinggi
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-danger/10 text-danger">
              <MaterialIcon name="bolt" className="text-[14px]" filled />
            </span>
          </div>
          <div className="mt-2">
            <span className="block font-body-sm text-[11px] font-semibold text-on-surface-variant">
              {history.peak
                ? `${dayName(fromDateKey(history.peak.date))}, ${formatDateShort(fromDateKey(history.peak.date))}`
                : "Belum ada data"}
            </span>
            <span className="font-mono text-[19px] font-bold leading-tight text-danger">
              {history.peak ? formatKwh(history.peak.kwh, 1).replace(" kWh", "") : "-"}{" "}
              <span className="text-[12px] font-normal text-on-surface">kWh</span>
            </span>
            <span className="block font-mono text-[12px] text-on-surface-variant">
              {history.peak ? formatRupiah(history.peak.rupiah) : "-"}
            </span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-status text-label-status uppercase text-on-surface-variant">
              Pemakaian Terendah
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-safe-tint text-safe-text">
              <MaterialIcon name="eco" className="text-[14px]" />
            </span>
          </div>
          <div className="mt-2">
            <span className="block font-body-sm text-[11px] font-semibold text-on-surface-variant">
              {history.lowest
                ? `${dayName(fromDateKey(history.lowest.date))}${
                    history.lowest.isToday ? " (Hari ini)" : ""
                  }, ${formatDateShort(fromDateKey(history.lowest.date))}`
                : "Belum ada data"}
            </span>
            <span className="font-mono text-[19px] font-bold leading-tight text-safe-text">
              {history.lowest ? formatKwh(history.lowest.kwh, 1).replace(" kWh", "") : "-"}{" "}
              <span className="text-[12px] font-normal text-on-surface">kWh</span>
            </span>
            <span className="block font-mono text-[12px] text-on-surface-variant">
              {history.lowest ? formatRupiah(history.lowest.rupiah) : "-"}
            </span>
          </div>
        </Card>
      </div>

      <Card className="flex flex-col">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="block font-headline-md text-body-lg font-bold text-on-surface">
              Grafik Konsumsi Harian
            </span>
            <span className="font-body-sm text-[12px] text-on-surface-variant">
              Ketuk batang grafik untuk melihat rincian
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-surface-container-low px-2 py-1">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="font-body-sm text-[11px] font-semibold text-on-surface">kWh</span>
          </div>
        </div>

        {selected ? <Inspector day={selected} targetKwh={targetKwh} /> : null}

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 16, right: 4, bottom: 0, left: -20 }}
              barCategoryGap="18%"
            >
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                interval={
                  chartData.length > 10 ? Math.max(1, Math.floor(chartData.length / 7)) : 0
                }
                tick={{ fontSize: 10, fill: "#3d4947" }}
              />
              <YAxis hide domain={[0, (dataMax: number) => Math.max(dataMax * 1.15, targetKwh * 1.2, 1)]} />
              {targetKwh > 0 ? (
                <ReferenceLine
                  y={targetKwh}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                />
              ) : null}
              <Bar
                dataKey="kwh"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
                onClick={(data: { payload?: HistoryDay }) => {
                  const entry = data.payload;
                  if (entry) setSelectedDate(entry.date);
                }}
              >
                {chartData.map((day) => (
                  <Cell key={day.date} fill={barColor(day, targetKwh)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-1 flex items-center justify-between text-on-surface-variant">
          <span className="font-body-sm text-[11px]">
            Tarif PLN: {formatRupiah(history.tariffPerKwh)} / kWh
          </span>
          <span className="font-body-sm text-[11px] italic">Garis merah = batas target</span>
        </div>
      </Card>

      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <span className="font-headline-md text-body-lg font-bold text-on-surface">
            Rincian Riwayat Harian
          </span>
          <span className="font-body-sm text-[11px] text-on-surface-variant">
            {history.days.length} Hari
          </span>
        </div>
        <div className="flex flex-col gap-space-xs">
          {detailDays.map((day) => {
            const status = historyDayStatus(day, targetKwh);
            return (
              <div
                key={day.date}
                className={cn(
                  "flex items-center justify-between rounded-xl bg-surface-container-lowest p-space-md shadow-soft",
                  status.tone === "warn" && "border-l-4 border-l-warn",
                  status.tone === "danger" && "border-l-4 border-l-danger",
                  day.isMissing && "opacity-60",
                )}
              >
                <div className="flex items-center gap-space-sm">
                  <div
                    className={cn(
                      "flex h-10 w-10 flex-col items-center justify-center rounded-lg font-bold",
                      dayTileStyles[status.tone],
                    )}
                  >
                    <span className="font-headline-md text-[12px] leading-tight">
                      {fromDateKey(day.date).getDate()}
                    </span>
                    <span className="font-label-status text-[9px] uppercase">
                      {dayShortName(fromDateKey(day.date))}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-body-md text-body-md font-bold text-on-surface">
                        {formatDateShort(fromDateKey(day.date))}
                        {day.isToday ? " (Hari ini)" : ""}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 font-label-status text-[10px] font-bold",
                          badgeStyles[status.tone],
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                    <span className="font-body-sm text-[12px] text-on-surface-variant">
                      {status.description}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block font-mono text-body-lg font-bold text-on-surface">
                    {day.isMissing ? "-" : formatKwh(day.kwh, 1)}
                  </span>
                  <span className="font-mono text-body-sm text-on-surface-variant">
                    {day.isMissing ? "Belum ada data" : formatRupiah(day.rupiah)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-low p-space-md shadow-soft">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <MaterialIcon name="description" className="text-[22px]" />
          </div>
          <div>
            <span className="block font-headline-md text-body-md font-bold leading-tight text-on-surface">
              Laporan Pembukuan Kos
            </span>
            <span className="font-body-sm text-[12px] text-on-surface-variant">
              Simpan rekap konsumsi untuk audit dan tagihan
            </span>
          </div>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-gutter-sm">
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary font-headline-md text-body-sm text-on-primary shadow-soft transition-opacity active:opacity-90"
          >
            <MaterialIcon name="picture_as_pdf" className="text-[18px]" />
            Unduh PDF
          </button>
          <button
            type="button"
            onClick={() => handleExport("csv")}
            className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-surface-container-lowest font-headline-md text-body-sm text-on-surface shadow-soft transition-colors active:bg-surface-container-high"
          >
            <MaterialIcon name="table_chart" className="text-[18px]" />
            Ekspor CSV
          </button>
        </div>
      </div>
    </PageContainer>
  );
}

function HistorySkeleton() {
  return (
    <PageContainer>
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-gutter-sm">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
    </PageContainer>
  );
}

export function HistoryScreen() {
  const { data, error, loading } = useAppData();
  const [range, setRange] = useState<HistoryRange>("7d");

  if (!data) {
    if (loading) return <HistorySkeleton />;
    return (
      <PageContainer>
        <EmptyState
          icon="cloud_off"
          title="Gagal memuat riwayat"
          description={error ?? "Data belum tersedia. Coba lagi beberapa saat."}
        />
      </PageContainer>
    );
  }

  const history = selectHistory(data, range);
  return (
    <HistoryContent
      history={history}
      range={range}
      kosName={data.kos.name}
      onRangeChange={setRange}
    />
  );
}

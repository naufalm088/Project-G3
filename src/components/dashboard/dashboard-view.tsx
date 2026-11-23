"use client";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MaterialIcon } from "@/components/ui/material-icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { StaleBanner } from "@/components/ui/stale-banner";
import { useToast } from "@/components/ui/toast";
import { useAppData } from "@/components/providers/app-data-provider";
import { PageContainer } from "@/components/layout/page-container";
import {
  formatKwh,
  formatNumber,
  formatPercent,
  formatRupiah,
  statusDescriptionFromTone,
} from "@/lib/energy";
import { formatMonthYear, formatRelativeMinutes, minutesSince } from "@/lib/date";
import { selectDashboard } from "@/lib/selectors";
import type { DashboardView, RoomMetric, StatusTone } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusPanelStyles: Record<
  StatusTone,
  { wrapper: string; title: string; badge: string; dot: string; icon: string; text: string }
> = {
  safe: {
    wrapper: "bg-safe-tint",
    title: "text-safe-text",
    badge: "bg-safe/15 text-safe-text",
    dot: "bg-safe",
    icon: "verified",
    text: "text-safe-text",
  },
  warn: {
    wrapper: "bg-warn-tint",
    title: "text-warn-text",
    badge: "bg-warn/20 text-warn-text",
    dot: "bg-warn",
    icon: "warning",
    text: "text-warn-text",
  },
  danger: {
    wrapper: "bg-danger-tint",
    title: "text-danger-text",
    badge: "bg-danger/20 text-danger-text",
    dot: "bg-danger",
    icon: "dangerous",
    text: "text-danger-text",
  },
  neutral: {
    wrapper: "bg-surface-container-low",
    title: "text-on-surface",
    badge: "bg-surface-container-high text-on-surface-variant",
    dot: "bg-outline",
    icon: "help",
    text: "text-on-surface-variant",
  },
};

const roomBadgeStyles: Record<StatusTone, string> = {
  safe: "bg-safe-tint text-safe-text",
  warn: "bg-warn-tint text-warn-text",
  danger: "bg-danger-tint text-danger-text",
  neutral: "bg-surface-container-high text-on-surface-variant",
};

const roomTileStyles: Record<StatusTone, string> = {
  safe: "bg-surface-container-low",
  warn: "bg-warn-tint/60",
  danger: "bg-danger-tint/60",
  neutral: "bg-surface-container-low",
};

function SensorTile({
  label,
  value,
  unit,
  hint,
  hintIcon,
  valueClassName,
}: {
  label: string;
  value: string;
  unit: string;
  hint: string;
  hintIcon: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col rounded-lg bg-surface-container-low p-3">
      <span className="font-body-sm text-[11px] font-medium text-on-surface-variant">{label}</span>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className={cn("font-mono text-headline-md font-bold text-on-surface", valueClassName)}>
          {value}
        </span>
        <span className="font-body-sm text-[11px] text-on-surface-variant">{unit}</span>
      </div>
      <span className="mt-1 flex items-center gap-0.5 font-body-sm text-[10px] text-on-surface-variant">
        <MaterialIcon name={hintIcon} className="text-[12px]" />
        {hint}
      </span>
    </div>
  );
}

function RoomCard({ metric, onNotify }: { metric: RoomMetric; onNotify: (metric: RoomMetric) => void }) {
  const { room, tone, isTopConsumer } = metric;
  const statusText = tone === "danger" ? "Bahaya" : tone === "warn" ? "Waspada" : "Normal";
  const badgeLabel = isTopConsumer && tone !== "safe" ? "Boros" : null;

  return (
    <Card
      className={cn(
        "flex flex-col gap-3",
        tone === "warn" && "ring-2 ring-warn/40",
        tone === "danger" && "ring-2 ring-danger/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg font-mono font-bold",
              tone === "warn" && "bg-warn-tint text-warn-text",
              tone === "danger" && "bg-danger-tint text-danger-text",
              tone === "safe" && "bg-surface-container text-primary",
              tone === "neutral" && "bg-surface-container text-on-surface-variant",
            )}
          >
            {`${room.sortOrder}`.padStart(2, "0")}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-headline-md text-body-lg font-bold text-on-surface">
                {room.name}
              </span>
              {badgeLabel ? (
                <span className="rounded bg-warn-tint px-1.5 py-0.5 font-body-sm text-[10px] font-semibold text-warn-text">
                  {badgeLabel}
                </span>
              ) : null}
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {room.tenantName ? `Penghuni: ${room.tenantName}` : "Belum ada penghuni"}
            </span>
          </div>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-label-status text-label-status font-bold",
            roomBadgeStyles[tone],
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              tone === "safe" && "bg-safe",
              tone === "warn" && "animate-pulse bg-warn",
              tone === "danger" && "animate-pulse bg-danger",
              tone === "neutral" && "bg-outline",
            )}
          />
          {statusText}
        </span>
      </div>

      <div className={cn("grid grid-cols-2 gap-2 rounded-lg p-2.5", roomTileStyles[tone])}>
        <div>
          <span className="block font-body-sm text-[11px] text-on-surface-variant">
            {isTopConsumer ? "Akumulasi Tertinggi" : "Akumulasi Bulan Ini"}
          </span>
          <span className="font-mono text-body-lg font-bold text-on-surface">
            {formatKwh(metric.monthlyKwh, 1)}
          </span>
          <span className="block font-body-sm text-[11px] text-on-surface-variant">
            ~{formatRupiah(metric.monthlyCost)}
          </span>
        </div>
        <div>
          <span className="block font-body-sm text-[11px] text-on-surface-variant">
            Beban Daya Saat Ini
          </span>
          <span className="font-mono text-body-lg font-bold text-primary">
            {formatNumber(metric.currentWatt, 0)} W
          </span>
          <span className="block font-body-sm text-[11px] font-medium text-tertiary">
            {room.relayOn ? "Relay MCB ON" : "Relay MCB OFF"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="flex items-center gap-1 font-body-sm text-[12px] text-on-surface-variant">
          <MaterialIcon
            name={tone === "safe" ? "check_circle" : "warning"}
            className={cn("text-[16px]", tone === "safe" ? "text-tertiary" : "text-warn")}
          />
          {tone === "safe" ? "Pemakaian Hemat" : isTopConsumer ? "Perlu diingatkan" : "Pantau pemakaian"}
        </span>
        <button
          type="button"
          onClick={() => onNotify(metric)}
          className={cn(
            "flex items-center gap-1 rounded-lg px-3 py-1.5 font-body-sm text-body-sm font-semibold transition-colors active:scale-95",
            isTopConsumer && tone !== "safe"
              ? "bg-primary text-on-primary shadow-sm"
              : "bg-surface-container-high text-on-surface hover:bg-surface-container",
          )}
        >
          <MaterialIcon name={isTopConsumer && tone !== "safe" ? "send" : "chat"} className="text-[16px]" />
          {isTopConsumer && tone !== "safe" ? "Ingatkan WA" : "Tagihan WA"}
        </button>
      </div>
    </Card>
  );
}

function DashboardContent({ dashboard }: { dashboard: DashboardView }) {
  const { toast } = useToast();
  const { profile, settings } = dashboard;
  const firstName = profile.fullName.replace(/^(Bu|Pak|Mas|Mbak)\s+/i, "");
  const panel = statusPanelStyles[dashboard.tone];
  const now = new Date();
  const updatedLabel = formatRelativeMinutes(minutesSince(dashboard.lastReadingAt, now));
  const topRoom = dashboard.rooms.find((metric) => metric.isTopConsumer) ?? dashboard.rooms[0];

  function handleNotify(metric: RoomMetric) {
    toast({
      title: `Pesan WA ${metric.room.name} disiapkan`,
      description: `Tagihan bulan ini ${formatKwh(metric.monthlyKwh, 1)} (~${formatRupiah(
        metric.monthlyCost,
      )}). Fitur kirim otomatis aktif di mode Supabase.`,
      tone: "info",
    });
  }

  return (
    <PageContainer>
      {dashboard.isStale ? (
        <StaleBanner
          tone={dashboard.deviceOnline ? "warn" : "danger"}
          title={dashboard.deviceOnline ? "Data sensor tertunda" : "Sensor terputus"}
          description={
            dashboard.deviceOnline
              ? `Pembaruan terakhir ${updatedLabel}. Angka yang tampil adalah data terakhir yang tersimpan.`
              : "Perangkat tidak mengirim data lebih dari 5 menit. Periksa koneksi ESP32 dan PZEM."
          }
        />
      ) : null}

      <Card className="flex flex-col gap-space-sm overflow-hidden">
        <div className="flex items-start justify-between gap-space-sm">
          <div className="flex min-w-0 flex-col">
            <h1 className="flex items-center gap-1.5 font-headline-lg-mobile text-headline-lg-mobile font-extrabold text-on-surface">
              Halo, {firstName}
              <span aria-hidden="true" className="inline-block animate-bounce text-xl">
                👋
              </span>
            </h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-1 font-body-md text-body-md text-on-surface-variant">
              <MaterialIcon name="home_work" className="text-[18px] text-primary" filled />
              <span className="font-semibold text-on-surface">{dashboard.kosName}</span>
              <span>• {dashboard.roomCount} Kamar Terpantau</span>
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <MaterialIcon name="bolt" className="text-[22px]" />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2.5 py-1 font-label-status text-label-status text-on-surface-variant">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                dashboard.deviceOnline ? "bg-tertiary" : "bg-danger",
              )}
            />
            {dashboard.deviceOnline ? "ESP32 & PZEM Terhubung" : "Perangkat Offline"}
          </div>
          <div className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
            <MaterialIcon name="sync" className="text-[15px]" />
            <span>Diperbarui {updatedLabel}</span>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-3 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="font-label-status text-label-status font-bold uppercase tracking-wider text-on-surface-variant">
            FT-01 • Total Tagihan Berjalan
          </span>
          <span className="rounded bg-surface-container-high px-2 py-0.5 font-body-sm text-body-sm font-medium text-on-secondary-fixed-variant">
            {formatMonthYear(now)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="font-body-sm text-body-sm font-medium text-on-surface-variant">
            Perkiraan Biaya Sementara
          </span>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="font-mono text-headline-xl-mobile font-extrabold tracking-tight text-primary">
              {formatRupiah(dashboard.monthlyCost)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
            <span className="font-mono font-semibold text-on-surface">
              {formatKwh(dashboard.monthlyKwh, 1)}
            </span>
            <span>•</span>
            <span>Tarif PLN: {formatRupiah(settings.tariffPerKwh)} / kWh</span>
          </div>
        </div>
        <div className="mt-1 flex flex-col gap-1.5 rounded-lg bg-surface-container-low p-3">
          <div className="flex items-center justify-between font-body-sm text-body-sm">
            <span className="font-medium text-on-surface-variant">Pemakaian Batas Anggaran</span>
            <span className="font-mono text-[13px] font-bold text-on-surface">
              {formatPercent(dashboard.budgetRatio, 1)}{" "}
              <span className="font-sans text-[11px] font-normal text-on-surface-variant">
                / {formatRupiah(dashboard.budgetLimit)}
              </span>
            </span>
          </div>
          <ProgressBar
            value={dashboard.budgetRatio}
            tone={
              dashboard.tone === "neutral"
                ? "primary"
                : (dashboard.tone as "safe" | "warn" | "danger")
            }
          />
          <div className="flex justify-between pt-0.5 font-body-sm text-[11px] text-on-surface-variant">
            <span>Rp 0</span>
            <span>Target Limit: {formatRupiah(dashboard.budgetLimit)}</span>
          </div>
        </div>
      </Card>

      <div className={cn("flex flex-col gap-3 rounded-xl p-space-md shadow-soft", panel.wrapper)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("h-3 w-3 animate-pulse rounded-full", panel.dot)} />
            <span className={cn("font-headline-md text-body-lg font-bold", panel.title)}>
              Status Saat Ini: {dashboard.statusLabel}
            </span>
          </div>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-label-status text-label-status font-bold",
              panel.badge,
            )}
          >
            FT-02
          </span>
        </div>
        <p className={cn("font-body-md text-body-md leading-snug", panel.text)}>
          Pemakaian telah mencapai <strong>{formatPercent(dashboard.budgetRatio, 1)}</strong> dari
          batas budget bulanan ({formatRupiah(dashboard.budgetLimit)}).{" "}
          {statusDescriptionFromTone(dashboard.tone)}
        </p>
        <div className="flex items-center justify-around gap-1 rounded-lg bg-white/80 p-2.5 font-body-sm text-[11px] text-on-surface">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-tertiary-container" />
            <span className="font-semibold text-tertiary">AMAN &lt;75%</span>
          </div>
          <div className="h-3.5 w-px bg-outline-variant/30" />
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-warn" />
            <span
              className={cn(
                "font-bold",
                dashboard.tone === "warn"
                  ? "text-warn-text underline decoration-warn"
                  : "text-warn-text",
              )}
            >
              WASPADA 75-95%
            </span>
          </div>
          <div className="h-3.5 w-px bg-outline-variant/30" />
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-error" />
            <span className="font-semibold text-error">BAHAYA &gt;95%</span>
          </div>
        </div>
      </div>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-container text-primary">
              <MaterialIcon name="speed" className="text-[18px]" />
            </div>
            <span className="font-headline-md text-body-lg font-bold text-on-surface">
              Panel Sensor Terpusat
            </span>
          </div>
          <span className="rounded bg-surface-container px-2 py-0.5 font-label-status text-label-status text-on-surface-variant">
            PZEM-004T v3.0
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <SensorTile
            label="Tegangan Listrik"
            value={formatNumber(dashboard.voltage ?? 0, 1)}
            unit="Volt"
            hint="Standar PLN 220V"
            hintIcon="check_circle"
          />
          <SensorTile
            label="Total Arus Listrik"
            value={formatNumber(dashboard.totalCurrent, 2)}
            unit="Ampere"
            hint="Batas MCB Induk 10A"
            hintIcon="info"
          />
          <SensorTile
            label="Total Daya Aktif"
            value={formatNumber(dashboard.totalWatt, 0)}
            unit="Watt"
            hint={`Dari ${dashboard.roomCount} Kamar Aktif`}
            hintIcon="bolt"
            valueClassName="text-primary"
          />
          <SensorTile
            label="Frekuensi Jaringan"
            value={formatNumber(dashboard.frequency ?? 0, 1)}
            unit="Hz"
            hint="Frekuensi Stabil"
            hintIcon="verified"
          />
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
              Rincian {dashboard.roomCount} Kamar Kos
            </h2>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Monitoring per MCB Kamar
            </span>
          </div>
          <span className="rounded-full bg-secondary-container px-2.5 py-1 font-label-status text-label-status font-semibold text-on-secondary-container">
            {dashboard.rooms.length} Terkoneksi
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {dashboard.rooms.length > 0 ? (
            dashboard.rooms.map((metric) => (
              <RoomCard key={metric.room.id} metric={metric} onNotify={handleNotify} />
            ))
          ) : (
            <EmptyState
              icon="meeting_room"
              title="Belum ada kamar"
              description="Tambahkan kamar di menu Limit & Atur untuk mulai memantau."
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-soft">
          <MaterialIcon name="lightbulb" className="text-[20px]" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="font-body-md text-body-md font-bold text-on-surface">
            Tips Cerdas untuk {profile.fullName}
          </span>
          <span className="font-body-sm text-body-sm leading-snug text-on-surface-variant">
            {topRoom
              ? `${topRoom.room.name} menyumbang ${formatPercent(
                  topRoom.shareOfTotal,
                  0,
                )} dari total pemakaian bulan ini. Atur pengingat tagihan otomatis di menu Limit & Atur.`
              : "Atur pengingat tagihan otomatis di menu Limit & Atur agar anggaran tetap terkendali."}
          </span>
        </div>
      </div>
    </PageContainer>
  );
}

function DashboardSkeleton() {
  return (
    <PageContainer>
      <Card className="flex flex-col gap-3">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </Card>
      <Card className="flex flex-col gap-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-3 w-full" />
      </Card>
      <Skeleton className="h-32 w-full rounded-xl" />
      <Card className="flex flex-col gap-3">
        <Skeleton className="h-5 w-1/2" />
        <div className="grid grid-cols-2 gap-2.5">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Card>
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </PageContainer>
  );
}

export function DashboardScreen() {
  const { data, error, loading, refresh } = useAppData();

  if (!data && loading) {
    return <DashboardSkeleton />;
  }

  if (!data && error) {
    return (
      <PageContainer>
        <EmptyState
          icon="cloud_off"
          title="Gagal memuat data"
          description={error}
          action={
            <button
              type="button"
              onClick={() => void refresh()}
              className="mt-1 rounded-lg bg-primary px-4 py-2 font-body-sm text-body-sm font-semibold text-on-primary"
            >
              Coba lagi
            </button>
          }
        />
      </PageContainer>
    );
  }

  if (!data) {
    return <DashboardSkeleton />;
  }

  const dashboard = selectDashboard(data);
  return <DashboardContent dashboard={dashboard} />;
}

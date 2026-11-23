"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageContainer } from "@/components/layout/page-container";
import { useAppData } from "@/components/providers/app-data-provider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MaterialIcon } from "@/components/ui/material-icon";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { CctvFrame } from "@/components/cctv/cctv-frame";
import { Kos3DView } from "@/components/kos/kos-3d-view";
import { RoomCard } from "@/components/kos/room-card";
import { formatRupiah, formatRupiahShort } from "@/lib/format";
import { selectDashboard } from "@/lib/selectors";
import type { UiMode } from "@/lib/types";
import { cn } from "@/lib/utils";

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: string | number;
  tone?: "primary" | "safe" | "warn" | "danger" | "neutral";
}) {
  const toneClass =
    tone === "safe"
      ? "text-safe"
      : tone === "warn"
        ? "text-warn-text"
        : tone === "danger"
          ? "text-danger-text"
          : tone === "neutral"
            ? "text-on-surface-variant"
            : "text-primary";
  return (
    <Card className="flex items-center gap-3 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container text-primary">
        <MaterialIcon name={icon} className="text-[20px]" />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="font-body-sm text-[11px] font-medium text-on-surface-variant">{label}</span>
        <span className={cn("font-mono text-headline-md font-bold", toneClass)}>{value}</span>
      </div>
    </Card>
  );
}

function DashboardContent({ dashboard }: { dashboard: ReturnType<typeof selectDashboard> }) {
  const { toast } = useToast();
  const { saveSettings } = useAppData();
  const [mode, setMode] = useState<UiMode>(dashboard.uiMode);

  const { profile, counts, monthlyIncome, incomeHistory, notifications } = dashboard;
  const firstName = profile.fullName.replace(/^(Bu|Pak|Mas|Mbak)\s+/i, "");
  const incomePercent =
    monthlyIncome.target > 0 ? (monthlyIncome.collected / monthlyIncome.target) * 100 : 0;

  async function handleModeChange(next: UiMode) {
    setMode(next);
    try {
      await saveSettings({ uiMode: next });
    } catch (err) {
      toast({
        title: "Gagal menyimpan mode tampilan",
        description: err instanceof Error ? err.message : "Coba lagi.",
        tone: "error",
      });
    }
  }

  function handleTagihSemua() {
    toast({
      title: "Penagihan disiapkan",
      description: `${counts.pending + counts.overdue} kamar belum lunas. Buka detail kamar untuk kirim WA.`,
      tone: "info",
    });
  }

  return (
    <PageContainer className="lg:max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-soft">
            <MaterialIcon name="home_work" className="text-[24px]" filled />
          </div>
          <div className="flex min-w-0 flex-col">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold text-on-surface lg:text-headline-lg">
              Halo, {firstName}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {dashboard.kosName} • {counts.total} Kamar
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ModeToggle value={mode} onChange={handleModeChange} />
          <button
            type="button"
            onClick={handleTagihSemua}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 font-body-sm text-body-sm font-semibold text-on-primary shadow-soft transition-opacity active:opacity-90"
          >
            <MaterialIcon name="send" className="text-[18px]" />
            Tagih Semua
          </button>
        </div>
      </div>

      {/* CCTV preview */}
      <Card className="flex flex-col gap-2 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MaterialIcon name="videocam" className="text-[20px] text-primary" />
            <span className="font-headline-md text-body-lg font-bold text-on-surface">CCTV Kos</span>
          </div>
          <Link href="/cctv" className="font-body-sm text-[12px] font-semibold text-primary">
            Lihat penuh →
          </Link>
        </div>
        <CctvFrame url={dashboard.cctvUrl} />
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon="meeting_room" label="Total Kamar" value={counts.total} />
        <StatCard icon="check_circle" label="Terisi" value={counts.occupied} tone="safe" />
        <StatCard icon="door_front" label="Kosong" value={counts.vacant} tone="neutral" />
        <StatCard icon="warning" label="Jatuh Tempo" value={counts.overdue} tone={counts.overdue > 0 ? "danger" : "neutral"} />
      </div>

      {/* Income */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="font-label-status text-label-status font-bold uppercase tracking-wider text-on-surface-variant">
              Pendapatan {formatPeriodLabel(monthlyIncome.period)}
            </span>
            <span className="rounded-full bg-secondary-container px-2.5 py-1 font-label-status text-label-status font-semibold text-on-secondary-container">
              Target {formatRupiahShort(monthlyIncome.target)}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-headline-xl-mobile font-extrabold tracking-tight text-primary">
              {formatRupiah(monthlyIncome.collected)}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              dari {formatRupiah(monthlyIncome.target)}
            </span>
          </div>
          <ProgressBar value={incomePercent} tone={incomePercent >= 100 ? "safe" : incomePercent >= 60 ? "primary" : "warn"} />
          <div className="flex flex-wrap items-center gap-3 font-body-sm text-[11px] text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-safe" /> Lunas {formatRupiahShort(monthlyIncome.collected)}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-warn" /> Belum {formatRupiahShort(monthlyIncome.pending)}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-danger" /> Jatuh tempo {formatRupiahShort(monthlyIncome.overdue)}
            </span>
          </div>
        </Card>

        <Card className="flex flex-col gap-2 lg:col-span-3">
          <div className="flex items-center justify-between">
            <span className="font-headline-md text-body-lg font-bold text-on-surface">Tren Pemasukan 6 Bulan</span>
            <span className="font-body-sm text-[11px] text-on-surface-variant">Target garis merah</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeHistory} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5eeff" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#3d4947" }} />
                <YAxis hide domain={[0, (max: number) => Math.max(max * 1.15, 1)]} />
                <Tooltip
                  cursor={{ fill: "rgba(0,104,95,0.06)" }}
                  contentStyle={{ borderRadius: 12, border: "1px solid #bcc9c6", fontSize: 12 }}
                  formatter={(v) => formatRupiah(Number(v))}
                />
                <Bar dataKey="target" fill="#bcc9c6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" fill="#00685f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Rooms */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Kamar Kos</h2>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {counts.occupied} terisi • {counts.vacant} kosong • {counts.maintenance} maintenance
            </span>
          </div>
          <Link
            href="/pengaturan"
            className="flex h-9 items-center gap-1.5 rounded-xl bg-surface-container-high px-3 font-body-sm text-body-sm font-semibold text-on-surface transition-colors hover:bg-surface-container active:scale-95"
          >
            <MaterialIcon name="add" className="text-[18px]" />
            Tambah Kamar
          </Link>
        </div>

        {mode === "modern" ? (
          <Kos3DView rooms={dashboard.rooms} photoUrl="/kos-photo.png" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dashboard.rooms.map((m) => (
              <RoomCard key={m.room.id} metric={m} />
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      {notifications.length > 0 ? (
        <Card className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <MaterialIcon name="notifications" className="text-[20px] text-primary" />
            <span className="font-headline-md text-body-lg font-bold text-on-surface">Notifikasi</span>
          </div>
          <div className="flex flex-col gap-2">
            {notifications.slice(0, 5).map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-2 rounded-lg p-2.5",
                  n.severity === "danger" && "bg-danger-tint text-danger-text",
                  n.severity === "warn" && "bg-warn-tint text-warn-text",
                  n.severity === "info" && "bg-surface-container-low text-on-surface",
                )}
              >
                <MaterialIcon
                  name={n.severity === "danger" ? "error" : n.severity === "warn" ? "warning" : "info"}
                  className="text-[18px]"
                />
                <div className="flex min-w-0 flex-col">
                  <span className="font-body-sm text-[12px] leading-snug">{n.message}</span>
                  <span className="font-body-sm text-[10px] opacity-70">{n.createdAt.slice(0, 10)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Tips */}
      <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-soft">
          <MaterialIcon name="lightbulb" className="text-[20px]" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="font-body-md text-body-md font-bold text-on-surface">Tips Pengelolaan Kos</span>
          <span className="font-body-sm text-body-sm leading-snug text-on-surface-variant">
            {counts.overdue > 0
              ? `${counts.overdue} kamar jatuh tempo. Buka detail kamar untuk kirim pengingat WA.`
              : counts.vacant > 0
                ? `${counts.vacant} kamar kosong. Pertimbangkan promo untuk mengisi kamar.`
                : "Semua kamar terisi dan lunas. Pertahankan!"}
          </span>
        </div>
      </div>
    </PageContainer>
  );
}

function formatPeriodLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return `${months[(m ?? 1) - 1]} ${y}`;
}

function DashboardSkeleton() {
  return (
    <PageContainer className="lg:max-w-7xl">
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </PageContainer>
  );
}

export function DashboardScreen() {
  const { data, error, loading } = useAppData();

  if (!data && loading) return <DashboardSkeleton />;
  if (!data && error) {
    return (
      <PageContainer>
        <EmptyState
          icon="cloud_off"
          title="Gagal memuat data"
          description={error}
        />
      </PageContainer>
    );
  }
  if (!data) return <DashboardSkeleton />;

  const dashboard = selectDashboard(data);
  return <DashboardContent dashboard={dashboard} />;
}

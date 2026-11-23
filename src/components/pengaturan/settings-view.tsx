"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { useAppData } from "@/components/providers/app-data-provider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MaterialIcon } from "@/components/ui/material-icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { DEMO_MODE, USE_SUPABASE } from "@/lib/config";
import { formatKwh, formatNumber, formatPercent, formatRupiah } from "@/lib/energy";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { selectDashboard } from "@/lib/selectors";
import type { DashboardView, Settings } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEFAULT_BUDGET = 850_000;

const toggleSizes = {
  lg: {
    track: "h-8 w-14",
    knob: "after:top-[4px] after:left-[4px] after:h-6 after:w-6",
    shift: "peer-checked:after:translate-x-6",
  },
  md: {
    track: "h-6 w-11",
    knob: "after:top-[2px] after:left-[2px] after:h-5 after:w-5",
    shift: "peer-checked:after:translate-x-5",
  },
} as const;

function Toggle({
  checked,
  onChange,
  label,
  size = "md",
  tone = "primary",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  size?: "lg" | "md";
  tone?: "primary" | "tertiary" | "danger";
}) {
  const s = toggleSizes[size];
  return (
    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        className={cn(
          "relative rounded-full bg-surface-container-highest transition-colors",
          "after:absolute after:rounded-full after:bg-white after:shadow-md after:transition-all after:content-['']",
          s.track,
          s.knob,
          s.shift,
          tone === "primary" && "peer-checked:bg-primary",
          tone === "tertiary" && "peer-checked:bg-tertiary",
          tone === "danger" && "peer-checked:bg-danger",
        )}
      />
    </label>
  );
}

function parseDigits(value: string): number {
  const digits = value.replace(/[^0-9]/g, "");
  return digits ? Number.parseInt(digits, 10) : 0;
}

function SettingsForm({
  settings,
  profileName,
  dashboard,
  saveSettings,
}: {
  settings: Settings;
  profileName: string;
  dashboard: DashboardView;
  saveSettings: (patch: Partial<Settings>) => Promise<void>;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [budget, setBudget] = useState(settings.budgetLimit);
  const [notifActive, setNotifActive] = useState(settings.notifActive);
  const [notifWaspada, setNotifWaspada] = useState(settings.notifWaspada);
  const [notifBahaya, setNotifBahaya] = useState(settings.notifBahaya);
  const [notifWa, setNotifWa] = useState(settings.notifWa);
  const [notifPush, setNotifPush] = useState(settings.notifPush);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      if (!DEMO_MODE && USE_SUPABASE) {
        const client = getSupabaseBrowserClient();
        await client?.auth.signOut();
      }
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  const tariff = settings.tariffPerKwh;
  const kwhEstimate = tariff > 0 ? budget / tariff : 0;
  const waspadaAmount = Math.round((budget * settings.warnThreshold) / 100);
  const bahayaAmount = Math.round((budget * settings.dangerThreshold) / 100);
  const usedPercent = budget > 0 ? (dashboard.monthlyCost / budget) * 100 : 0;
  const usedTone = usedPercent >= settings.dangerThreshold ? "danger" : usedPercent >= settings.warnThreshold ? "warn" : "safe";

  const dirty =
    budget !== settings.budgetLimit ||
    notifActive !== settings.notifActive ||
    notifWaspada !== settings.notifWaspada ||
    notifBahaya !== settings.notifBahaya ||
    notifWa !== settings.notifWa ||
    notifPush !== settings.notifPush;

  function adjustBudget(delta: number) {
    setBudget((prev) => Math.max(0, Math.min(100_000_000, prev + delta)));
  }

  async function handleSave() {
    if (budget < 100_000) {
      toast({
        title: "Anggaran terlalu kecil",
        description: "Minimal Rp 100.000 agar batas peringatan tetap masuk akal.",
        tone: "error",
      });
      return;
    }

    setSaving(true);
    try {
      await saveSettings({
        kosId: settings.kosId,
        budgetLimit: budget,
        notifActive,
        notifWaspada,
        notifBahaya,
        notifWa,
        notifPush,
      });
      toast({
        title: "Pengaturan berhasil disimpan",
        description:
          dashboard.profile.id === "demo-owner"
            ? "Tersimpan pada sesi demo. Hubungkan Supabase agar permanen."
            : "Parameter tersimpan dan siap disinkronkan ke perangkat.",
        tone: "success",
      });
    } catch (error) {
      toast({
        title: "Gagal menyimpan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan tak terduga.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer>
      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-1 text-primary">
          <MaterialIcon name="tune" className="text-[20px]" filled />
          <span className="font-label-status text-label-status uppercase tracking-wider text-primary">
            Modul FT-04 &amp; FT-05
          </span>
        </div>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold text-on-surface">
          Pengaturan Anggaran &amp; Limit Listrik
        </h1>
        <p className="font-body-md leading-relaxed text-on-surface-variant">
          Atur batas biaya bulanan agar tagihan PLN kos tidak membengkak dan pantau otomatis 24
          jam.
        </p>
      </section>

      <Card className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-primary">
              <MaterialIcon name="account_balance_wallet" className="text-[20px]" filled />
            </div>
            <span className="font-headline-md text-body-lg text-on-surface">
              Batas Anggaran Bulanan
            </span>
          </div>
          <span className="rounded-full bg-secondary-container px-2.5 py-1 font-label-status text-label-status text-on-secondary-fixed">
            Siklus Aktif
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            className="font-body-sm font-medium text-on-surface-variant"
            htmlFor="budget-input"
          >
            Target Pengeluaran Maksimal (Rp)
          </label>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3.5 font-mono text-body-lg text-primary">
              Rp
            </span>
            <input
              id="budget-input"
              type="text"
              inputMode="numeric"
              value={budget > 0 ? formatNumber(budget, 0) : ""}
              onChange={(event) => setBudget(parseDigits(event.target.value))}
              className="h-14 w-full rounded-xl bg-surface-container-low pl-12 pr-4 font-mono text-metric-currency tracking-tight text-on-surface shadow-inner outline-none transition-colors focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30"
              placeholder="850.000"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-body-sm text-[12px] text-on-surface-variant">
            Pilihan Tambahan Cepat:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => adjustBudget(50_000)}
              className="h-11 rounded-lg bg-surface-container-high px-2 text-center font-body-sm font-semibold text-on-surface transition-all hover:bg-surface-dim active:scale-95"
            >
              + Rp 50 rb
            </button>
            <button
              type="button"
              onClick={() => adjustBudget(100_000)}
              className="h-11 rounded-lg bg-surface-container-high px-2 text-center font-body-sm font-semibold text-on-surface transition-all hover:bg-surface-dim active:scale-95"
            >
              + Rp 100 rb
            </button>
            <button
              type="button"
              onClick={() => setBudget(DEFAULT_BUDGET)}
              className="h-11 rounded-lg bg-secondary-container px-2 text-center font-body-sm font-semibold text-on-secondary-fixed transition-all hover:opacity-90 active:scale-95"
            >
              Reset (850k)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-surface-container-low p-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed">
            <MaterialIcon name="electric_meter" className="text-[20px]" filled />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-body-sm text-[12px] leading-none text-on-surface-variant">
              Konversi Daya Listrik
            </span>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="font-body-sm text-[13px] text-on-surface">Setara dengan</span>
              <span className="font-mono text-metric-kwh leading-tight text-primary">
                ~{formatKwh(kwhEstimate, 1)}
              </span>
            </div>
            <span className="font-body-sm text-[11px] text-secondary">
              Berdasarkan tarif resmi PLN {formatRupiah(tariff)} / kWh
            </span>
          </div>
        </div>

        <div className="mt-1 flex flex-col gap-1.5">
          <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
            <span>Ambang Penggunaan Saat Ini</span>
            <span className="font-mono font-semibold text-on-surface">
              {formatPercent(usedPercent, 0)} ({formatRupiah(dashboard.monthlyCost)})
            </span>
          </div>
          <ProgressBar
            value={usedPercent}
            tone={usedTone}
            label="Pemakaian terhadap anggaran"
          />
          <div className="flex items-center justify-between font-label-status text-[10px] uppercase text-secondary">
            <span
              className={cn(
                "font-bold",
                usedTone === "safe" ? "text-tertiary" : "text-on-surface-variant",
              )}
            >
              ● {usedTone === "safe" ? "Terpakai Normal" : "Melebihi Normal"}
            </span>
            <span>Waspada {settings.warnThreshold}%</span>
            <span className="font-bold text-error">Bahaya {settings.dangerThreshold}%</span>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between pb-1">
          <div className="flex min-w-0 items-center gap-2 pr-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed">
              <MaterialIcon name="notifications_active" className="text-[24px]" filled />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-headline-md text-body-lg font-bold leading-tight text-on-surface">
                Alarm Batas Anggaran
              </span>
              <span className="font-body-sm text-[12px] leading-tight text-on-surface-variant">
                Master toggle deteksi beban
              </span>
            </div>
          </div>
          <Toggle
            checked={notifActive}
            onChange={setNotifActive}
            label="Aktifkan alarm batas anggaran"
            size="lg"
          />
        </div>

        <div
          className={cn(
            "flex flex-col gap-space-sm transition-opacity",
            notifActive ? "opacity-100" : "pointer-events-none opacity-50",
          )}
        >
          <span className="font-label-status text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Tingkat Sensitivitas Notifikasi
          </span>

          <div className="flex items-start justify-between gap-2 rounded-xl bg-surface-container-low p-4">
            <div className="flex min-w-0 items-start gap-2">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-container">
                <MaterialIcon name="warning" className="text-[16px]" filled />
              </div>
              <div className="flex min-w-0 flex-col">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-headline-md text-body-md font-bold leading-none text-on-surface">
                    Peringatan Waspada
                  </span>
                  <span className="rounded-full bg-secondary-container px-2 py-0.5 font-label-status text-[10px] font-bold text-on-secondary-container">
                    {settings.warnThreshold}% Budget
                  </span>
                </div>
                <p className="mt-1 font-body-sm text-[12px] text-on-surface-variant">
                  Dipicu saat biaya mencapai{" "}
                  <strong className="font-mono text-on-surface">
                    {formatRupiah(waspadaAmount)}
                  </strong>
                  . Menyarankan penghuni berhemat AC.
                </p>
              </div>
            </div>
            <div className="mt-1">
              <Toggle
                checked={notifWaspada}
                onChange={setNotifWaspada}
                label="Aktifkan peringatan waspada"
                tone="tertiary"
              />
            </div>
          </div>

          <div className="flex items-start justify-between gap-2 rounded-xl bg-danger-tint p-4">
            <div className="flex min-w-0 items-start gap-2">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger text-white">
                <MaterialIcon name="fmd_bad" className="text-[16px]" filled />
              </div>
              <div className="flex min-w-0 flex-col">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-headline-md text-body-md font-bold leading-none text-danger-text">
                    Peringatan Kritis (Bahaya)
                  </span>
                  <span className="rounded-full bg-danger px-2 py-0.5 font-label-status text-[10px] font-bold text-white">
                    {settings.dangerThreshold}% Budget
                  </span>
                </div>
                <p className="mt-1 font-body-sm text-[12px] text-on-surface-variant">
                  Dipicu saat biaya menyentuh{" "}
                  <strong className="font-mono text-danger-text">
                    {formatRupiah(bahayaAmount)}
                  </strong>
                  . Rekomendasi pembatasan daya darurat.
                </p>
              </div>
            </div>
            <div className="mt-1">
              <Toggle
                checked={notifBahaya}
                onChange={setNotifBahaya}
                label="Aktifkan peringatan bahaya"
                tone="danger"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <span className="font-label-status text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Saluran Pengiriman Laporan
          </span>
          <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed">
                <MaterialIcon name="chat" className="text-[18px]" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="font-body-md text-[13px] font-semibold text-on-surface">
                  WhatsApp {profileName}
                </span>
                <span className="font-mono text-[12px] text-on-surface-variant">
                  {settings.waNumber ?? "Nomor belum diatur"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-label-status text-[10px] font-semibold",
                  notifWa
                    ? "bg-tertiary-container text-on-tertiary-container"
                    : "bg-surface-container-high text-on-surface-variant",
                )}
              >
                {notifWa ? "Terhubung" : "Nonaktif"}
              </span>
              <Toggle checked={notifWa} onChange={setNotifWa} label="Aktifkan notifikasi WhatsApp" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-fixed">
                <MaterialIcon name="cell_tower" className="text-[18px]" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="font-body-md text-[13px] font-semibold text-on-surface">
                  Push Notifikasi HP
                </span>
                <span className="font-body-sm text-[12px] text-on-surface-variant">
                  Perangkat Chrome Browser
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-label-status text-[10px] font-semibold",
                  notifPush
                    ? "bg-secondary-fixed-dim text-on-secondary-fixed"
                    : "bg-surface-container-high text-on-surface-variant",
                )}
              >
                {notifPush ? "Aktif" : "Nonaktif"}
              </span>
              <Toggle checked={notifPush} onChange={setNotifPush} label="Aktifkan push notifikasi" />
            </div>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MaterialIcon name="memory" className="text-[20px] text-secondary" />
            <span className="font-headline-md text-body-md font-bold text-on-surface">
              Parameter Teknis PLN &amp; IoT
            </span>
          </div>
          <span className="rounded bg-surface-container-high px-2 py-0.5 font-label-status text-[10px] text-on-surface-variant">
            Hardware G3
          </span>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-0.5 rounded-lg bg-surface-container-low p-2.5">
            <span className="font-body-sm text-[11px] text-on-surface-variant">Golongan Tarif</span>
            <span className="font-body-md text-[13px] font-bold text-on-surface">
              R-1/TR (Subsidi Non)
            </span>
            <span className="font-body-sm text-[10px] text-secondary">Daya 1.300 - 2.200 VA</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-lg bg-surface-container-low p-2.5">
            <span className="font-body-sm text-[11px] text-on-surface-variant">
              Tarif Dasar Listrik
            </span>
            <span className="font-mono text-[13px] font-bold text-primary">
              {formatRupiah(tariff)}
            </span>
            <span className="font-body-sm text-[10px] text-secondary">Per kWh resmi PLN</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-lg bg-surface-container-low p-2.5">
            <span className="font-body-sm text-[11px] text-on-surface-variant">Modul Sensor</span>
            <span className="font-body-md text-[13px] font-bold text-on-surface">
              4x PZEM-004T v3
            </span>
            <span className="font-body-sm text-[10px] text-tertiary">CT Clamp Non-Invasive</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-lg bg-surface-container-low p-2.5">
            <span className="font-body-sm text-[11px] text-on-surface-variant">
              Siklus Periode Tagihan
            </span>
            <span className="font-body-md text-[13px] font-bold text-on-surface">
              Tgl 1 - Akhir Bulan
            </span>
            <span className="font-body-sm text-[10px] text-secondary">Reset otomatis 00:00</span>
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 rounded-lg bg-surface-container p-2.5 text-[11px] text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                dashboard.deviceOnline ? "animate-pulse bg-tertiary-container" : "bg-danger",
              )}
            />
            <span className="font-body-sm font-semibold text-on-surface">
              {dashboard.deviceOnline ? "ESP32 Gateway Node: Normal" : "ESP32 Gateway: Offline"}
            </span>
          </div>
          <span className="font-label-status text-secondary">Refresh 5 dtk</span>
        </div>
      </Card>

      <Card className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
            <MaterialIcon name="logout" className="text-[18px]" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-body-md text-[13px] font-semibold text-on-surface">
              Keluar dari akun
            </span>
            <span className="font-body-sm text-[11px] text-on-surface-variant">
              {DEMO_MODE ? "Kembali ke layar masuk (mode demo)" : "Akhiri sesi pada perangkat ini"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          className="shrink-0 rounded-lg bg-surface-container-high px-3 py-2 font-body-sm text-body-sm font-semibold text-on-surface transition-colors hover:bg-surface-container active:scale-95 disabled:opacity-60"
        >
          {signingOut ? "Keluar…" : "Keluar"}
        </button>
      </Card>

      <section className="flex flex-col gap-2 pb-2">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !dirty}
          className={cn(
            "flex h-14 w-full items-center justify-center gap-2 rounded-xl font-headline-md text-body-lg font-bold shadow-float transition-all active:scale-[0.98]",
            dirty && !saving
              ? "bg-primary text-on-primary hover:bg-primary-container"
              : "cursor-not-allowed bg-surface-container-high text-on-surface-variant",
          )}
        >
          <MaterialIcon name={saving ? "sync" : "cloud_sync"} className="text-[24px]" />
          {saving ? "Menyimpan…" : "Simpan Perubahan Pengaturan"}
        </button>
        <p className="text-center font-body-sm text-[11px] text-on-surface-variant">
          Pengaturan disimpan ke database dan siap disinkronkan ke modul ESP32 kos.
        </p>
      </section>
    </PageContainer>
  );
}

export function SettingsScreen() {
  const { data, loading, error, saveSettings } = useAppData();

  if (!data) {
    if (loading) {
      return (
        <PageContainer>
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </PageContainer>
      );
    }
    return (
      <PageContainer>
        <EmptyState
          icon="cloud_off"
          title="Gagal memuat pengaturan"
          description={error ?? "Data belum tersedia. Coba muat ulang halaman."}
        />
      </PageContainer>
    );
  }

  const dashboard = selectDashboard(data);

  return (
    <SettingsForm
      key={data.settings.kosId}
      settings={data.settings}
      profileName={data.profile.fullName}
      dashboard={dashboard}
      saveSettings={saveSettings}
    />
  );
}

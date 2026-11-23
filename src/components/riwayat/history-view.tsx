"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { useAppData } from "@/components/providers/app-data-provider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MaterialIcon } from "@/components/ui/material-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { PaymentBadge } from "@/components/kos/payment-badge";

import { formatRupiah, formatPeriod } from "@/lib/format";
import {
  PAYMENT_STATUS_OPTIONS,
  periodsAvailable,
  selectPaymentHistory,
  selectPayments,
  type PaymentFilter,
} from "@/lib/selectors";
import { downloadPaymentCsv, downloadPaymentPdf } from "@/lib/export";


export function HistoryScreen() {
  const { data, loading, error } = useAppData();
  const { toast } = useToast();
  const [period, setPeriod] = useState<string>("all");
  const [roomId, setRoomId] = useState<string>("");
  const [status, setStatus] = useState<PaymentFilter["status"]>("all");

  if (!data) {
    if (loading) {
      return (
        <PageContainer className="lg:max-w-7xl">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </PageContainer>
      );
    }
    return (
      <PageContainer>
        <EmptyState icon="cloud_off" title="Gagal memuat riwayat" description={error ?? "Data belum tersedia."} />
      </PageContainer>
    );
  }

  const history = selectPaymentHistory(data);
  const periods = periodsAvailable(data);
  const filtered = selectPayments(data, { period, roomId: roomId || undefined, status });

  const totalCollected = filtered.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const totalPending = filtered.filter((p) => p.status === "pending").reduce((a, p) => a + p.amount, 0);
  const totalOverdue = filtered.filter((p) => p.status === "overdue").reduce((a, p) => a + p.amount, 0);

  const roomMap = new Map(data.rooms.map((r) => [r.id, r]));
  const tenantMap = new Map(data.tenants.map((t) => [t.id, t]));

  function handleExport(kind: "pdf" | "csv") {
    const view = { ...history, payments: filtered };
    try {
      if (kind === "pdf") downloadPaymentPdf(view, data!.kos.name);
      else downloadPaymentCsv(view, data!.kos.name);
      toast({ title: kind === "pdf" ? "Laporan PDF berhasil diunduh" : "Data CSV berhasil diunduh", tone: "success" });
    } catch (err) {
      toast({ title: "Gagal membuat laporan", description: err instanceof Error ? err.message : "Coba lagi.", tone: "error" });
    }
  }

  return (
    <PageContainer className="lg:max-w-7xl">
      <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col">
          <span className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold tracking-tight text-on-surface lg:text-headline-lg">
            Riwayat Pembayaran
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Rekap tagihan kamar • {filtered.length} catatan
          </span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
          <MaterialIcon name="receipt_long" className="text-[22px]" />
        </div>
      </div>

      {/* Filters */}
      <Card className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-10 rounded-xl bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Semua Periode</option>
            {periods.map((p) => (
              <option key={p} value={p}>{formatPeriod(p)}</option>
            ))}
          </select>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="h-10 rounded-xl bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Semua Kamar</option>
            {data.rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PaymentFilter["status"])}
            className="h-10 rounded-xl bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
          >
            {PAYMENT_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-safe-tint p-2.5">
            <span className="block font-body-sm text-[10px] font-bold uppercase text-safe-text">Lunas</span>
            <span className="font-mono text-body-sm font-bold text-safe-text">{formatRupiah(totalCollected)}</span>
          </div>
          <div className="rounded-lg bg-warn-tint p-2.5">
            <span className="block font-body-sm text-[10px] font-bold uppercase text-warn-text">Belum</span>
            <span className="font-mono text-body-sm font-bold text-warn-text">{formatRupiah(totalPending)}</span>
          </div>
          <div className="rounded-lg bg-danger-tint p-2.5">
            <span className="block font-body-sm text-[10px] font-bold uppercase text-danger-text">Jatuh Tempo</span>
            <span className="font-mono text-body-sm font-bold text-danger-text">{formatRupiah(totalOverdue)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary font-body-sm text-body-sm font-semibold text-on-primary shadow-soft transition-opacity active:opacity-90"
          >
            <MaterialIcon name="picture_as_pdf" className="text-[18px]" />
            Unduh PDF
          </button>
          <button
            type="button"
            onClick={() => handleExport("csv")}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-surface-container-lowest font-body-sm text-body-sm font-semibold text-on-surface shadow-soft transition-colors active:bg-surface-container-high"
          >
            <MaterialIcon name="table_chart" className="text-[18px]" />
            Ekspor CSV
          </button>
        </div>
      </Card>

      {/* List - mobile cards */}
      <div className="flex flex-col gap-2 lg:hidden">
        {filtered.length === 0 ? (
          <EmptyState icon="receipt_long" title="Tidak ada catatan" description="Ubah filter untuk melihat data." />
        ) : (
          filtered.map((p) => {
            const room = roomMap.get(p.roomId);
            const tenant = p.tenantId ? tenantMap.get(p.tenantId) : undefined;
            return (
              <Card key={p.id} className="flex items-center justify-between gap-2 p-3">
                <div className="flex min-w-0 flex-col">
                  <span className="font-body-md text-body-sm font-semibold text-on-surface">
                    {room?.name ?? "Kamar"} • {formatPeriod(p.period)}
                  </span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant">
                    {tenant?.fullName ?? "-"} • {p.paidAt ? `Lunas ${new Date(p.paidAt).toLocaleDateString("id-ID")}` : `JT ${new Date(p.dueDate).toLocaleDateString("id-ID")}`}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-mono text-body-sm font-bold text-on-surface">{formatRupiah(p.amount)}</span>
                  <PaymentBadge status={p.status} />
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Table - desktop */}
      <Card className="hidden overflow-hidden p-0 lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-4 py-3 font-label-status text-[11px] font-bold uppercase text-on-surface-variant">Periode</th>
                <th className="px-4 py-3 font-label-status text-[11px] font-bold uppercase text-on-surface-variant">Kamar</th>
                <th className="px-4 py-3 font-label-status text-[11px] font-bold uppercase text-on-surface-variant">Penghuni</th>
                <th className="px-4 py-3 font-label-status text-[11px] font-bold uppercase text-on-surface-variant text-right">Jumlah</th>
                <th className="px-4 py-3 font-label-status text-[11px] font-bold uppercase text-on-surface-variant">Jatuh Tempo</th>
                <th className="px-4 py-3 font-label-status text-[11px] font-bold uppercase text-on-surface-variant">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center font-body-sm text-on-surface-variant">
                    Tidak ada catatan.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const room = roomMap.get(p.roomId);
                  const tenant = p.tenantId ? tenantMap.get(p.tenantId) : undefined;
                  return (
                    <tr key={p.id} className="border-t border-outline-variant/30">
                      <td className="px-4 py-3 font-body-sm text-on-surface">{formatPeriod(p.period)}</td>
                      <td className="px-4 py-3 font-body-sm font-semibold text-on-surface">{room?.name ?? "-"}</td>
                      <td className="px-4 py-3 font-body-sm text-on-surface-variant">{tenant?.fullName ?? "-"}</td>
                      <td className="px-4 py-3 text-right font-mono text-body-sm font-bold text-on-surface">{formatRupiah(p.amount)}</td>
                      <td className="px-4 py-3 font-body-sm text-on-surface-variant">{new Date(p.dueDate).toLocaleDateString("id-ID")}</td>
                      <td className="px-4 py-3"><PaymentBadge status={p.status} /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
}

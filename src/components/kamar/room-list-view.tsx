"use client";

import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { useAppData } from "@/components/providers/app-data-provider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MaterialIcon } from "@/components/ui/material-icon";
import { RoomStatusBadge, PaymentBadge } from "@/components/kos/payment-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/format";
import { selectRoomMetrics } from "@/lib/selectors";
import { cn } from "@/lib/utils";

export function RoomListScreen() {
  const { data, loading, error } = useAppData();

  if (!data) {
    if (loading) {
      return (
        <PageContainer className="lg:max-w-7xl">
          <Skeleton className="h-8 w-1/3" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </PageContainer>
      );
    }
    return (
      <PageContainer>
        <EmptyState icon="cloud_off" title="Gagal memuat kamar" description={error ?? "Data belum tersedia."} />
      </PageContainer>
    );
  }

  const metrics = selectRoomMetrics(data);

  return (
    <PageContainer className="lg:max-w-7xl">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold tracking-tight text-on-surface">
            Daftar Kamar
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            {data.rooms.length} kamar • {data.rooms.filter((r) => r.status === "occupied").length} terisi
          </span>
        </div>
        <Link
          href="/pengaturan"
          className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 font-body-sm text-body-sm font-semibold text-on-primary shadow-soft transition-opacity active:opacity-90"
        >
          <MaterialIcon name="add" className="text-[18px]" />
          Kelola
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <Link key={m.room.id} href={m.room.status === "maintenance" ? "#" : `/kamar/${m.room.id}`} onClick={m.room.status === "maintenance" ? (e) => e.preventDefault() : undefined}>
            <Card
              className={cn(
                "flex flex-col gap-3 transition-transform active:scale-[0.99]",
                m.room.status === "maintenance" && "opacity-70",
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg font-mono font-bold",
                      m.room.status === "occupied" && "bg-primary-fixed text-on-primary-fixed",
                      m.room.status === "vacant" && "bg-surface-container text-on-surface-variant",
                      m.room.status === "maintenance" && "bg-warn-tint text-warn-text",
                    )}
                  >
                    {m.room.number}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-md text-body-lg font-bold text-on-surface">{m.room.name}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {m.tenant ? m.tenant.fullName : m.room.status === "maintenance" ? "Under Maintenance" : "Belum ada penghuni"}
                    </span>
                  </div>
                </div>
                <RoomStatusBadge status={m.room.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-body-sm text-[11px] text-on-surface-variant">Sewa</span>
                <span className="font-mono text-body-sm font-bold text-on-surface">{formatRupiah(m.effectiveRent)}</span>
              </div>
              {m.room.status === "occupied" ? (
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-[11px] text-on-surface-variant">Tagihan</span>
                  <PaymentBadge status={m.paymentStatus} />
                </div>
              ) : null}
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}

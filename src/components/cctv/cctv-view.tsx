"use client";

import { PageContainer } from "@/components/layout/page-container";
import { useAppData } from "@/components/providers/app-data-provider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MaterialIcon } from "@/components/ui/material-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { CctvFrame } from "@/components/cctv/cctv-frame";
import Link from "next/link";

export function CctvScreen() {
  const { data, loading, error } = useAppData();

  if (!data) {
    if (loading) {
      return (
        <PageContainer className="lg:max-w-5xl">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </PageContainer>
      );
    }
    return (
      <PageContainer>
        <EmptyState icon="cloud_off" title="Gagal memuat CCTV" description={error ?? "Data belum tersedia."} />
      </PageContainer>
    );
  }

  const url = data.settings.cctvUrl ?? data.kos.cctvUrl;

  return (
    <PageContainer className="lg:max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold tracking-tight text-on-surface">
            CCTV Kos
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Siaran langsung kamera keamanan • {data.kos.name}
          </span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
          <MaterialIcon name="videocam" className="text-[22px]" />
        </div>
      </div>

      <CctvFrame url={url} full />

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <MaterialIcon name="info" className="text-[20px] text-primary" />
          <span className="font-headline-md text-body-lg font-bold text-on-surface">Informasi</span>
        </div>
        <ul className="flex flex-col gap-1.5 font-body-sm text-[12px] text-on-surface-variant">
          <li>• Kamera tunggal untuk seluruh area kos.</li>
          <li>• Jika belum terhubung, atur URL stream di Pengaturan → CCTV.</li>
          <li>• Mendukung URL HLS (.m3u8) atau iframe embed (RTSP via gateway).</li>
          <li>• Gunakan tombol layar penuh untuk tampilan monitor.</li>
        </ul>
        <Link
          href="/pengaturan"
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 font-body-sm text-body-sm font-semibold text-on-primary shadow-soft transition-opacity active:opacity-90"
        >
          <MaterialIcon name="settings" className="text-[18px]" />
          Atur URL CCTV
        </Link>
      </Card>
    </PageContainer>
  );
}

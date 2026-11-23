"use client";

import Link from "next/link";
import { MaterialIcon } from "@/components/ui/material-icon";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/format";
import { PaymentBadge, RoomStatusBadge } from "@/components/kos/payment-badge";
import type { RoomMetric } from "@/lib/types";

export function RoomCard({ metric }: { metric: RoomMetric }) {
  const { room, tenant, paymentStatus, effectiveRent } = metric;
  const isMaintenance = room.status === "maintenance";

  return (
    <Link
      href={isMaintenance ? "#" : `/kamar/${room.id}`}
      onClick={isMaintenance ? (e) => e.preventDefault() : undefined}
      className={cn("block", isMaintenance && "cursor-not-allowed")}
    >
      <Card
        className={cn(
          "flex flex-col gap-3 transition-transform active:scale-[0.99]",
          room.status === "occupied" && "ring-1 ring-safe/20",
          room.status === "vacant" && "opacity-90",
          isMaintenance && "bg-surface-container-low opacity-70",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg font-mono font-bold",
                room.status === "occupied" && "bg-primary-fixed text-on-primary-fixed",
                room.status === "vacant" && "bg-surface-container text-on-surface-variant",
                isMaintenance && "bg-warn-tint text-warn-text",
              )}
            >
              {room.number}
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-body-lg font-bold text-on-surface">{room.name}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {tenant ? tenant.fullName : room.status === "maintenance" ? "Under Maintenance" : "Belum ada penghuni"}
              </span>
            </div>
          </div>
          <RoomStatusBadge status={room.status} />
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-container-low p-2.5">
          <div>
            <span className="block font-body-sm text-[11px] text-on-surface-variant">Sewa Bulanan</span>
            <span className="font-mono text-body-lg font-bold text-on-surface">{formatRupiah(effectiveRent)}</span>
          </div>
          <div>
            <span className="block font-body-sm text-[11px] text-on-surface-variant">Status Bayar</span>
            <PaymentBadge status={paymentStatus} />
          </div>
        </div>

        {tenant?.phone ? (
          <div className="flex items-center gap-1 font-body-sm text-[11px] text-on-surface-variant">
            <MaterialIcon name="chat" className="text-[14px] text-tertiary" />
            {tenant.phone}
          </div>
        ) : null}
      </Card>
    </Link>
  );
}

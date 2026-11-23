"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { RoomMetric } from "@/lib/types";

type Props = {
  rooms: RoomMetric[];
  photoUrl?: string;
};

// posisi hotspot (persentase) di atas foto
const HOTSPOTS: Record<string, { left: string; top: string }> = {
  "1": { left: "8%", top: "72%" },
  "2": { left: "34%", top: "72%" },
  "3": { left: "60%", top: "72%" },
  "4": { left: "8%", top: "18%" },
  "5": { left: "34%", top: "18%" },
  "6": { left: "60%", top: "18%" },
  G: { left: "88%", top: "45%" },
};

export function Kos3DView({ rooms, photoUrl }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const { toast } = useToast();
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ px: number; x: number } | null>(null);

  const sorted = rooms.slice().sort((a, b) => a.room.sortOrder - b.room.sortOrder);

  function onPointerDown(e: React.PointerEvent) {
    setDragging(true);
    start.current = { px: e.clientX, x };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !start.current || !trackRef.current) return;
    const dx = e.clientX - start.current.px;
    const max = Math.max(0, trackRef.current.scrollWidth - trackRef.current.clientWidth);
    const next = Math.min(0, Math.max(-max, start.current.x + dx));
    setX(next);
  }
  function onPointerUp() {
    setDragging(false);
    start.current = null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface-container-low">
      <div
        ref={trackRef}
        className="relative h-[260px] w-full cursor-grab select-none overflow-hidden md:h-[340px]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{ touchAction: "pan-y" }}
      >
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: "100%",
            minWidth: 900,
            transform: `translateX(${x}px)`,
            transition: dragging ? "none" : "transform 0.25s ease-out",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl ?? "/kos-photo.png"}
            alt="Foto kos"
            className="h-full w-full object-cover"
            draggable={false}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          {!photoUrl ? (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-surface-container" />
          ) : null}

          {sorted.map((m) => {
            const pos = HOTSPOTS[m.room.number] ?? { left: "50%", top: "50%" };
            const isMaintenance = m.room.status === "maintenance";
            const isOccupied = m.room.status === "occupied";
            const href = isMaintenance ? "#" : `/kamar/${m.room.id}`;

            const badgeClass = isMaintenance
              ? "bg-warn-tint text-warn-text border-warn"
              : isOccupied
                ? "bg-primary text-on-primary border-primary"
                : "bg-surface-container-lowest text-on-surface-variant border-outline-variant";

            return (
              <Link
                key={m.room.id}
                href={href}
                onClick={
                  isMaintenance
                    ? (e) => {
                        e.preventDefault();
                        toast({ title: "Gudang sedang under maintenance", description: "Fitur untuk gudang akan tersedia nanti.", tone: "info" });
                      }
                    : undefined
                }
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                style={{ left: pos.left, top: pos.top }}
              >
                <div
                  className={cn(
                    "flex min-w-[72px] flex-col items-center gap-0.5 rounded-xl border px-2 py-1.5 shadow-float backdrop-blur transition-transform hover:scale-105",
                    badgeClass,
                  )}
                >
                  <span className="font-mono text-headline-md font-extrabold leading-none">{m.room.number}</span>
                  <span className="max-w-[80px] truncate font-body-sm text-[10px] font-semibold leading-tight opacity-90">
                    {isMaintenance ? "Gudang" : isOccupied ? (m.tenant?.fullName ?? "Terisi") : "Kosong"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-surface/80 px-2.5 py-1 font-body-sm text-[11px] text-on-surface-variant backdrop-blur">
        Geser kiri/kanan • Klik kamar untuk detail
      </div>
    </div>
  );
}

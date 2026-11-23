"use client";

import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils";

export function CctvFrame({
  url,
  full = false,
  onToggleFull,
}: {
  url: string | null;
  full?: boolean;
  onToggleFull?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  async function toggleFs() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await containerRef.current.requestFullscreen().catch(() => undefined);
    }
    onToggleFull?.();
  }

  const trimmed = url?.trim() ?? "";

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-xl bg-inverse-surface",
        full ? "aspect-video w-full" : "aspect-video w-full",
      )}
    >
      {trimmed ? (
        trimmed.toLowerCase().endsWith(".m3u8") ? (
          <video
            className="h-full w-full object-cover"
            src={trimmed}
            autoPlay
            muted
            playsInline
            controls={full}
          />
        ) : (
          <iframe
            src={trimmed}
            title="CCTV"
            className="h-full w-full border-0"
            allow="fullscreen"
            loading="lazy"
          />
        )
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-inverse-on-surface">
          <MaterialIcon name="videocam_off" className="text-[40px] opacity-60" />
          <span className="font-headline-md text-body-md font-bold">CCTV belum terhubung</span>
          <span className="font-body-sm text-[12px] opacity-70">
            Masukkan URL stream kamera di menu Pengaturan → CCTV untuk menampilkan siaran langsung.
          </span>
        </div>
      )}

      {trimmed ? (
        <button
          type="button"
          onClick={toggleFs}
          aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
          className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
        >
          <MaterialIcon name={isFullscreen ? "fullscreen_exit" : "fullscreen"} className="text-[20px]" />
        </button>
      ) : null}
    </div>
  );
}

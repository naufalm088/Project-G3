"use client";

import { APP_GROUP, APP_NAME, getInitials } from "@/lib/app-constants";
import { Logo } from "@/components/layout/logo";
import { MaterialIcon } from "@/components/ui/material-icon";
import { useAppData } from "@/components/providers/app-data-provider";

export function Header() {
  const { data } = useAppData();
  const profile = data?.profile;
  const fullName = profile?.fullName ?? "Memuat…";
  const role = profile?.role ?? "Pemilik Kos";
  const initials = profile ? getInitials(profile.fullName) : "··";
  const statusText = !data ? "Menghubungkan…" : data.source === "demo" ? "Mode Demo" : "Online 24/7";

  return (
    <header className="fixed top-0 z-50 w-full pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="flex h-16 items-center justify-between gap-space-sm px-gutter">
        <div className="flex min-w-0 items-center gap-gutter-sm">
          <Logo />
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-space-xs">
              <span className="truncate font-headline-md text-body-lg leading-tight text-on-surface">
                {APP_NAME}
              </span>
              <span className="rounded-full bg-secondary-container px-1.5 py-0.5 font-label-status text-label-status text-on-secondary-fixed text-[10px]">
                {APP_GROUP}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tertiary-container" />
              <span className="font-label-status text-label-status uppercase leading-none tracking-wide text-tertiary">
                {statusText}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-gutter-sm">
          <div className="flex items-center gap-space-xs rounded-full bg-surface-container-low py-1 pl-space-xs pr-1">
            <div className="hidden flex-col pl-2 text-right min-[360px]:flex">
              <span className="font-body-sm text-[11px] font-semibold leading-none text-on-surface">
                {fullName}
              </span>
              <span className="mt-0.5 font-body-sm text-[10px] leading-none text-on-surface-variant">
                {role}
              </span>
            </div>
            <span
              aria-label={`Avatar ${fullName}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed text-[12px] font-bold text-on-primary-fixed"
            >
              {initials}
            </span>
          </div>
          <span className="hidden text-on-surface-variant sm:flex">
            <MaterialIcon name="notifications" className="text-[22px]" />
          </span>
        </div>
      </div>
    </header>
  );
}

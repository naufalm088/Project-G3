"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Beranda", icon: "home" },
  { href: "/kamar", label: "Kamar", icon: "meeting_room" },
  { href: "/riwayat", label: "Riwayat", icon: "receipt_long" },
  { href: "/pengaturan", label: "Atur", icon: "tune" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed bottom-0 z-50 w-full pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.05)]"
    >
      <div className="mx-auto flex h-16 w-full max-w-md items-center justify-around px-gutter">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[48px] min-w-[64px] flex-col items-center justify-center gap-1 rounded-xl px-space-sm py-1 transition-colors",
                active
                  ? "text-primary font-bold"
                  : "text-on-surface-variant hover:text-on-surface",
              )}
            >
              <MaterialIcon name={item.icon} className="text-[24px]" filled={active} />
              <span className="text-[11px] leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

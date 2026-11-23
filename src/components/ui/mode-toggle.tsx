"use client";

import { cn } from "@/lib/utils";
import { MaterialIcon } from "@/components/ui/material-icon";
import type { UiMode } from "@/lib/types";

export function ModeToggle({
  value,
  onChange,
}: {
  value: UiMode;
  onChange: (mode: UiMode) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-surface-container-low p-1">
      <button
        type="button"
        onClick={() => onChange("classic")}
        aria-pressed={value === "classic"}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-body-sm text-body-sm font-semibold transition-all",
          value === "classic"
            ? "bg-surface-container-lowest text-primary shadow-soft"
            : "text-on-surface-variant hover:text-on-surface",
        )}
      >
        <MaterialIcon name="view_list" className="text-[16px]" />
        Klasik
      </button>
      <button
        type="button"
        onClick={() => onChange("modern")}
        aria-pressed={value === "modern"}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-body-sm text-body-sm font-semibold transition-all",
          value === "modern"
            ? "bg-surface-container-lowest text-primary shadow-soft"
            : "text-on-surface-variant hover:text-on-surface",
        )}
      >
        <MaterialIcon name="view_in_ar" className="text-[16px]" />
        Modern 3D
      </button>
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/types";

const toneStyles: Record<
  StatusTone,
  { wrapper: string; dot: string; defaultLabel: string }
> = {
  safe: {
    wrapper: "border-safe-border bg-safe-tint text-safe-text",
    dot: "bg-safe",
    defaultLabel: "AMAN - Normal",
  },
  warn: {
    wrapper: "border-warn-border bg-warn-tint text-warn-text",
    dot: "bg-warn animate-pulse",
    defaultLabel: "WASPADA - Boros",
  },
  danger: {
    wrapper: "border-danger-border bg-danger-tint text-danger-text",
    dot: "bg-danger animate-pulse",
    defaultLabel: "BAHAYA - Beban Lebih",
  },
  neutral: {
    wrapper: "border-outline-variant/60 bg-surface-container text-on-surface-variant",
    dot: "bg-outline",
    defaultLabel: "Tidak diketahui",
  },
};

type StatusBadgeProps = {
  tone?: StatusTone;
  label?: string;
  showDot?: boolean;
  className?: string;
};

export function StatusBadge({
  tone = "neutral",
  label,
  showDot = true,
  className,
}: StatusBadgeProps) {
  const styles = toneStyles[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-label-status text-label-status font-bold whitespace-nowrap",
        styles.wrapper,
        className,
      )}
    >
      {showDot ? (
        <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
      ) : null}
      {label ?? styles.defaultLabel}
    </span>
  );
}

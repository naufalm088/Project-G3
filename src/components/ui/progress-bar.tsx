import { cn } from "@/lib/utils";

export type ProgressTone = "primary" | "safe" | "warn" | "danger" | "secondary";

const toneClass: Record<ProgressTone, string> = {
  primary: "bg-primary",
  safe: "bg-safe",
  warn: "bg-warn",
  danger: "bg-danger",
  secondary: "bg-secondary-fixed-dim",
};

type ProgressBarProps = {
  value: number;
  tone?: ProgressTone;
  className?: string;
  barClassName?: string;
  label?: string;
};

export function ProgressBar({
  value,
  tone = "primary",
  className,
  barClassName,
  label = "Progres pemakaian anggaran",
}: ProgressBarProps) {
  const safeValue = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safeValue)}
      className={cn(
        "flex h-3 w-full overflow-hidden rounded-full bg-surface-container",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-700", toneClass[tone], barClassName)}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

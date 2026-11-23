import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils";

type StaleBannerProps = {
  tone?: "warn" | "danger";
  title: string;
  description: string;
  className?: string;
};

export function StaleBanner({ tone = "warn", title, description, className }: StaleBannerProps) {
  const isDanger = tone === "danger";

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-space-sm rounded-xl border p-space-md",
        isDanger
          ? "border-danger-border bg-danger-tint text-danger-text"
          : "border-warn-border bg-warn-tint text-warn-text",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isDanger ? "bg-danger/15 text-danger" : "bg-warn/15 text-warn",
        )}
      >
        <MaterialIcon name={isDanger ? "wifi_off" : "history" } className="text-[20px]" filled />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-headline-md text-body-md font-bold">{title}</span>
        <span className="font-body-sm text-body-sm opacity-90">{description}</span>
      </div>
    </div>
  );
}

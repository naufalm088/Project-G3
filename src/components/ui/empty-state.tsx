import type { ReactNode } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-space-sm rounded-xl bg-surface-container-low p-space-xl text-center",
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
        <MaterialIcon name={icon} className="text-[24px]" />
      </span>
      <div className="flex flex-col gap-1">
        <span className="font-headline-md text-body-lg font-bold text-on-surface">{title}</span>
        {description ? (
          <span className="font-body-sm text-body-sm text-on-surface-variant">{description}</span>
        ) : null}
      </div>
      {action}
    </div>
  );
}

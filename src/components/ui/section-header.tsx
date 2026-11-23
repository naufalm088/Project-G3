import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-space-sm", className)}>
      <div className="flex min-w-0 flex-col">
        <h2 className="font-headline-md text-headline-md font-bold text-on-surface">{title}</h2>
        {subtitle ? (
          <span className="font-body-sm text-body-sm text-on-surface-variant">{subtitle}</span>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

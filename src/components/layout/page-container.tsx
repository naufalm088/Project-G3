import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md flex-col gap-space-md px-gutter py-space-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

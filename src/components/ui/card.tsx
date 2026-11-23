import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative rounded-xl bg-surface-container-lowest p-space-md shadow-soft",
        className,
      )}
      {...props}
    />
  );
}

import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary shadow-soft",
        className,
      )}
    >
      <MaterialIcon name="bolt" className="text-[20px]" filled />
    </span>
  );
}

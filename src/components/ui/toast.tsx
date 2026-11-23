"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

type ToastOptions = {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
};

type ToastItem = ToastOptions & { id: number };

type ToastContextValue = {
  toast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, { wrapper: string; iconWrapper: string; icon: string }> = {
  success: {
    wrapper: "bg-tertiary text-on-tertiary",
    iconWrapper: "bg-tertiary-container text-on-tertiary-container",
    icon: "check_circle",
  },
  error: {
    wrapper: "bg-danger text-white",
    iconWrapper: "bg-white/20 text-white",
    icon: "error",
  },
  info: {
    wrapper: "bg-inverse-surface text-inverse-on-surface",
    iconWrapper: "bg-white/15 text-white",
    icon: "info",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = ++idRef.current;
      setItems((prev) => [...prev, { ...options, id }]);
      const duration = options.duration ?? 3600;
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 top-[calc(4.5rem+env(safe-area-inset-top,0px))] z-[70] flex flex-col items-center gap-2 px-gutter"
      >
        {items.map((item) => {
          const tone = toneStyles[item.tone ?? "info"];
          return (
            <div
              key={item.id}
              className={cn(
                "pointer-events-auto flex w-full max-w-md items-start gap-space-sm rounded-xl p-space-md shadow-float",
                tone.wrapper,
              )}
              role="status"
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  tone.iconWrapper,
                )}
              >
                <MaterialIcon name={tone.icon} className="text-[20px]" filled />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-headline-md text-body-md font-bold leading-tight">
                  {item.title}
                </span>
                {item.description ? (
                  <span className="font-body-sm text-body-sm leading-snug opacity-90">
                    {item.description}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Tutup notifikasi"
                className="shrink-0 rounded-full p-1 opacity-80 transition-opacity hover:opacity-100"
              >
                <MaterialIcon name="close" className="text-[18px]" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast harus dipakai di dalam <ToastProvider>");
  }
  return context;
}

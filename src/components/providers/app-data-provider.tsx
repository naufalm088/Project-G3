"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchAppData } from "@/lib/data/fetch-app-data";
import { buildDemoAppData } from "@/lib/mock/data";
import type { AppData, Settings } from "@/lib/types";

type AppDataContextValue = {
  data: AppData | null;
  loading: boolean;
  error: string | null;
  source: "demo" | "supabase";
  refresh: () => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => void;
  saveSettings: (patch: Partial<Settings>) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!client) {
      setData(buildDemoAppData());
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const next = await fetchAppData(client);
      setData(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    let cancelled = false;

    const request = client
      ? fetchAppData(client)
      : Promise.resolve(buildDemoAppData());

    request
      .then((next) => {
        if (cancelled) return;
        setData(next);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Gagal memuat data.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [client]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        settings: { ...prev.settings, ...patch, updatedAt: new Date().toISOString() },
      };
    });
  }, []);

  const saveSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const now = new Date().toISOString();

      if (!client) {
        setData((prev) => {
          if (!prev) return prev;
          return { ...prev, settings: { ...prev.settings, ...patch, updatedAt: now } };
        });
        return;
      }

      const kosId = patch.kosId ?? data?.settings.kosId;
      if (!kosId) {
        throw new Error("Data kos belum siap. Muat ulang halaman lalu coba lagi.");
      }

      const dbPatch: Record<string, unknown> = { updated_at: now };
      if (patch.budgetLimit !== undefined) dbPatch.budget_limit = patch.budgetLimit;
      if (patch.tariffPerKwh !== undefined) dbPatch.tariff_per_kwh = patch.tariffPerKwh;
      if (patch.notifActive !== undefined) dbPatch.notif_active = patch.notifActive;
      if (patch.notifWaspada !== undefined) dbPatch.notif_waspada = patch.notifWaspada;
      if (patch.notifBahaya !== undefined) dbPatch.notif_bahaya = patch.notifBahaya;
      if (patch.notifWa !== undefined) dbPatch.notif_wa = patch.notifWa;
      if (patch.notifPush !== undefined) dbPatch.notif_push = patch.notifPush;
      if (patch.warnThreshold !== undefined) dbPatch.warn_threshold = patch.warnThreshold;
      if (patch.dangerThreshold !== undefined) dbPatch.danger_threshold = patch.dangerThreshold;
      if (patch.waNumber !== undefined) dbPatch.wa_number = patch.waNumber;

      const { error: updateError } = await client
        .from("settings")
        .update(dbPatch)
        .eq("kos_id", kosId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setData((prev) => {
        if (!prev) return prev;
        return { ...prev, settings: { ...prev.settings, ...patch, updatedAt: now } };
      });
    },
    [client, data?.settings.kosId],
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      loading,
      error,
      source: client ? "supabase" : "demo",
      refresh,
      updateSettings,
      saveSettings,
    }),
    [data, loading, error, client, refresh, updateSettings, saveSettings],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData harus dipakai di dalam <AppDataProvider>");
  }
  return context;
}

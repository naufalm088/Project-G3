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
  isDemo: boolean;
  client: ReturnType<typeof getSupabaseBrowserClient>;
  refresh: () => Promise<void>;
  updateData: (updater: (prev: AppData) => AppData) => void;
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
    const request = client ? fetchAppData(client) : Promise.resolve(buildDemoAppData());
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

  const updateData = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => (prev ? updater(prev) : prev));
  }, []);

  const saveSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const now = new Date().toISOString();
      if (!client) {
        setData((prev) => (prev ? { ...prev, settings: { ...prev.settings, ...patch, updatedAt: now } } : prev));
        return;
      }
      const kosId = patch.kosId ?? data?.kos.id;
      if (!kosId) throw new Error("Data kos belum siap.");

      const dbPatch: Record<string, unknown> = { updated_at: now };
      if (patch.rentDueDay !== undefined) dbPatch.rent_due_day = patch.rentDueDay;
      if (patch.defaultRent !== undefined) dbPatch.default_rent = patch.defaultRent;
      if (patch.notifActive !== undefined) dbPatch.notif_active = patch.notifActive;
      if (patch.notifReminder !== undefined) dbPatch.notif_reminder = patch.notifReminder;
      if (patch.notifOverdue !== undefined) dbPatch.notif_overdue = patch.notifOverdue;
      if (patch.ownerPhone !== undefined) dbPatch.owner_phone = patch.ownerPhone;
      if (patch.cctvUrl !== undefined) dbPatch.cctv_url = patch.cctvUrl;
      if (patch.uiMode !== undefined) dbPatch.ui_mode = patch.uiMode;
      if (patch.waTemplate !== undefined) dbPatch.wa_template = patch.waTemplate;

      const { error: updateError } = await client.from("settings").update(dbPatch).eq("kos_id", kosId);
      if (updateError) throw new Error(updateError.message);

      setData((prev) => (prev ? { ...prev, settings: { ...prev.settings, ...patch, updatedAt: now } } : prev));
    },
    [client, data?.kos.id],
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      loading,
      error,
      source: client ? "supabase" : "demo",
      isDemo: !client,
      client,
      refresh,
      updateData,
      saveSettings,
    }),
    [data, loading, error, client, refresh, updateData, saveSettings],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData harus dipakai di dalam <AppDataProvider>");
  return context;
}

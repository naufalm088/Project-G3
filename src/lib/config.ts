export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const hasSupabaseEnv = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const USE_SUPABASE = !DEMO_MODE && hasSupabaseEnv;

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const TARIF_PLN_DEFAULT = 1444.7;

export const STALE_THRESHOLD_MS = 5 * 60 * 1000;

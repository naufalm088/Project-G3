import type { SupabaseClient } from "@supabase/supabase-js";
import { TARIF_PLN_DEFAULT } from "@/lib/config";
import { addDays, startOfDay, toDateKey } from "@/lib/date";
import { buildDemoAppData } from "@/lib/mock/data";
import type {
  AppData,
  DailySummary,
  Device,
  NotificationRow,
  ProfileInfo,
  Reading,
  Room,
  Settings,
} from "@/lib/types";

type ProfileRow = {
  id: string;
  full_name: string;
  role: string;
  phone: string | null;
};

type KosRow = {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
};

type RoomRow = {
  id: string;
  kos_id: string;
  name: string;
  tenant_name: string | null;
  sort_order: number;
  mcb_limit_amp: number | string;
  relay_on: boolean;
};

type DeviceRow = {
  id: string;
  kos_id: string;
  room_id: string | null;
  name: string;
  last_seen_at: string | null;
  is_online: boolean;
};

type ReadingRow = {
  id: number | string;
  kos_id: string;
  room_id: string | null;
  device_id: string | null;
  ts: string;
  voltage: number | string | null;
  current: number | string | null;
  power_watt: number | string | null;
  energy_kwh: number | string;
  frequency: number | string | null;
  power_factor: number | string | null;
};

type SummaryRow = {
  kos_id: string;
  room_id: string | null;
  date: string;
  total_kwh: number | string;
  total_rupiah: number | string;
};

type SettingsRow = {
  id: string;
  kos_id: string;
  budget_limit: number | string;
  tariff_per_kwh: number | string;
  notif_active: boolean;
  notif_waspada: boolean;
  notif_bahaya: boolean;
  warn_threshold: number;
  danger_threshold: number;
  notif_wa: boolean;
  notif_push: boolean;
  wa_number: string | null;
  updated_at: string;
};

type NotificationRowDb = {
  id: string;
  kos_id: string;
  type: string;
  severity: "info" | "warn" | "danger";
  message: string;
  is_read: boolean;
  created_at: string;
};

function toNumber(value: number | string | null | undefined, fallback = 0): number {
  if (value == null) return fallback;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapRoom(row: RoomRow): Room {
  return {
    id: row.id,
    kosId: row.kos_id,
    name: row.name,
    tenantName: row.tenant_name,
    sortOrder: row.sort_order,
    mcbLimitAmp: toNumber(row.mcb_limit_amp, 10),
    relayOn: row.relay_on,
  };
}

function mapDevice(row: DeviceRow): Device {
  return {
    id: row.id,
    kosId: row.kos_id,
    roomId: row.room_id,
    name: row.name,
    lastSeenAt: row.last_seen_at,
    isOnline: row.is_online,
  };
}

function mapReading(row: ReadingRow): Reading {
  return {
    id: row.id,
    kosId: row.kos_id,
    roomId: row.room_id,
    deviceId: row.device_id,
    ts: row.ts,
    voltage: row.voltage == null ? null : toNumber(row.voltage),
    current: row.current == null ? null : toNumber(row.current),
    powerWatt: row.power_watt == null ? null : toNumber(row.power_watt),
    energyKwh: toNumber(row.energy_kwh),
    frequency: row.frequency == null ? null : toNumber(row.frequency),
    powerFactor: row.power_factor == null ? null : toNumber(row.power_factor),
  };
}

function mapSummary(row: SummaryRow): DailySummary {
  return {
    kosId: row.kos_id,
    roomId: row.room_id,
    date: row.date,
    totalKwh: toNumber(row.total_kwh),
    totalRupiah: toNumber(row.total_rupiah),
  };
}

function mapSettings(row: SettingsRow): Settings {
  return {
    id: row.id,
    kosId: row.kos_id,
    budgetLimit: toNumber(row.budget_limit, 850_000),
    tariffPerKwh: toNumber(row.tariff_per_kwh, TARIF_PLN_DEFAULT),
    notifActive: row.notif_active,
    notifWaspada: row.notif_waspada,
    notifBahaya: row.notif_bahaya,
    warnThreshold: row.warn_threshold,
    dangerThreshold: row.danger_threshold,
    notifWa: row.notif_wa,
    notifPush: row.notif_push,
    waNumber: row.wa_number,
    updatedAt: row.updated_at,
  };
}

function mapNotification(row: NotificationRowDb): NotificationRow {
  return {
    id: row.id,
    kosId: row.kos_id,
    type: row.type,
    severity: row.severity,
    message: row.message,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export async function fetchAppData(client: SupabaseClient | null): Promise<AppData> {
  if (!client) {
    return buildDemoAppData();
  }

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    throw new Error("Sesi login tidak ditemukan. Silakan masuk kembali.");
  }

  const [{ data: profileData }, { data: kosData, error: kosError }] = await Promise.all([
    client.from("profiles").select("id, full_name, role, phone").eq("id", user.id).maybeSingle(),
    client
      .from("kos")
      .select("id, owner_id, name, address")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (kosError) {
    throw new Error(kosError.message);
  }

  const kosRow = kosData as KosRow | null;
  if (!kosRow) {
    throw new Error("Data kos belum tersedia. Jalankan proses provisioning terlebih dahulu.");
  }

  const profileRow = profileData as ProfileRow | null;
  const kosId = kosRow.id;
  const historyStart = toDateKey(addDays(startOfDay(new Date()), -70));

  const [settingsRes, roomsRes, devicesRes, readingsRes, summariesRes, notificationsRes] =
    await Promise.all([
      client.from("settings").select("*").eq("kos_id", kosId).maybeSingle(),
      client.from("rooms").select("*").eq("kos_id", kosId).order("sort_order", { ascending: true }),
      client.from("devices").select("*").eq("kos_id", kosId),
      client
        .from("readings")
        .select("*")
        .eq("kos_id", kosId)
        .order("ts", { ascending: false })
        .limit(400),
      client
        .from("daily_summaries")
        .select("kos_id, room_id, date, total_kwh, total_rupiah")
        .eq("kos_id", kosId)
        .gte("date", historyStart)
        .order("date", { ascending: true }),
      client
        .from("notifications")
        .select("*")
        .eq("kos_id", kosId)
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

  let settingsRow = settingsRes.data as SettingsRow | null;

  if (!settingsRow) {
    const { data: inserted } = await client
      .from("settings")
      .insert({ kos_id: kosId })
      .select("*")
      .single();
    settingsRow = inserted as SettingsRow | null;
  }

  if (!settingsRow) {
    throw new Error("Pengaturan kos tidak dapat dimuat.");
  }

  const rooms = ((roomsRes.data as RoomRow[] | null) ?? []).map(mapRoom);
  const devices = ((devicesRes.data as DeviceRow[] | null) ?? []).map(mapDevice);
  const notifications = ((notificationsRes.data as NotificationRowDb[] | null) ?? []).map(
    mapNotification,
  );
  const summaries = ((summariesRes.data as SummaryRow[] | null) ?? []).map(mapSummary);

  const latestReadings: Record<string, Reading | undefined> = {};
  for (const row of (readingsRes.data as ReadingRow[] | null) ?? []) {
    const reading = mapReading(row);
    if (reading.roomId && !latestReadings[reading.roomId]) {
      latestReadings[reading.roomId] = reading;
    }
  }

  const profile: ProfileInfo = {
    id: user.id,
    fullName: profileRow?.full_name ?? "Pemilik Kos",
    role: profileRow?.role ?? "Pemilik Kos",
    kosName: kosRow.name,
    phone: profileRow?.phone ?? null,
  };

  return {
    source: "supabase",
    profile,
    kos: {
      id: kosRow.id,
      ownerId: kosRow.owner_id,
      name: kosRow.name,
      address: kosRow.address,
    },
    settings: mapSettings(settingsRow),
    rooms,
    devices,
    latestReadings,
    summaries,
    notifications,
    fetchedAt: new Date().toISOString(),
  };
}

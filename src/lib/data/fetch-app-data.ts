import type { SupabaseClient } from "@supabase/supabase-js";
import { buildDemoAppData } from "@/lib/mock/data";
import type {
  AppData,
  Kos,
  NotificationRow,
  Payment,
  PaymentStatus,
  ProfileInfo,
  Room,
  RoomStatus,
  Settings,
  Tenant,
  UiMode,
} from "@/lib/types";

type ProfileRow = { id: string; full_name: string; role: string; phone: string | null };

type KosRow = { id: string; owner_id: string; name: string; address: string | null; cctv_url: string | null };

type RoomRow = {
  id: string;
  kos_id: string;
  room_number: string;
  name: string;
  floor: number;
  monthly_rent: number | string;
  status: RoomStatus;
  sort_order: number;
  created_at: string;
};

type TenantRow = {
  id: string;
  kos_id: string;
  room_id: string;
  full_name: string;
  phone: string | null;
  move_in_date: string | null;
  monthly_rent: number | string | null;
  due_day: number;
  notes: string | null;
  created_at: string;
};

type PaymentRow = {
  id: string;
  kos_id: string;
  room_id: string;
  tenant_id: string | null;
  period: string;
  amount: number | string;
  due_date: string;
  paid_at: string | null;
  status: PaymentStatus;
  method: string | null;
  notes: string | null;
  created_at: string;
};

type SettingsRow = {
  id: string;
  kos_id: string;
  rent_due_day: number;
  default_rent: number | string;
  notif_active: boolean;
  notif_reminder: boolean;
  notif_overdue: boolean;
  owner_phone: string | null;
  cctv_url: string | null;
  ui_mode: UiMode;
  wa_template: string | null;
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
    number: row.room_number,
    name: row.name,
    floor: row.floor,
    monthlyRent: toNumber(row.monthly_rent, 500_000),
    status: row.status,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function mapTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    kosId: row.kos_id,
    roomId: row.room_id,
    fullName: row.full_name,
    phone: row.phone,
    moveInDate: row.move_in_date,
    monthlyRent: row.monthly_rent == null ? null : toNumber(row.monthly_rent),
    dueDay: row.due_day,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function mapPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    kosId: row.kos_id,
    roomId: row.room_id,
    tenantId: row.tenant_id,
    period: row.period,
    amount: toNumber(row.amount),
    dueDate: row.due_date,
    paidAt: row.paid_at,
    status: row.status,
    method: row.method,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function mapSettings(row: SettingsRow): Settings {
  return {
    id: row.id,
    kosId: row.kos_id,
    rentDueDay: row.rent_due_day,
    defaultRent: toNumber(row.default_rent, 500_000),
    notifActive: row.notif_active,
    notifReminder: row.notif_reminder,
    notifOverdue: row.notif_overdue,
    ownerPhone: row.owner_phone,
  cctvUrl: row.cctv_url,
  uiMode: row.ui_mode,
  waTemplate: row.wa_template ?? null,
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

  // Provision kos if missing (creates kos + settings + 6 rooms + gudang).
  let kosId: string | null = null;

  const { data: existingKos } = await client
    .from("kos")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingKos?.id) {
    kosId = existingKos.id as string;
  } else {
    const { data: provisioned, error: provError } = await client.rpc("provision_owner", {
      p_kos_name: "Kos Saya",
    });
    if (provError) throw new Error(provError.message);
    kosId = provisioned as string;
  }

  if (!kosId) {
    throw new Error("Data kos belum tersedia.");
  }

  const [profileRes, kosRes, settingsRes, roomsRes, tenantsRes, paymentsRes, notifRes] =
    await Promise.all([
      client.from("profiles").select("id, full_name, role, phone").eq("id", user.id).maybeSingle(),
      client.from("kos").select("id, owner_id, name, address, cctv_url").eq("id", kosId).maybeSingle(),
      client.from("settings").select("*").eq("kos_id", kosId).maybeSingle(),
      client.from("rooms").select("*").eq("kos_id", kosId).order("sort_order", { ascending: true }),
      client.from("tenants").select("*").eq("kos_id", kosId),
      client.from("payments").select("*").eq("kos_id", kosId).order("period", { ascending: false }),
      client.from("notifications").select("*").eq("kos_id", kosId).order("created_at", { ascending: false }).limit(25),
    ]);

  const kosRow = kosRes.data as KosRow | null;
  if (!kosRow) throw new Error("Data kos tidak dapat dimuat.");

  let settingsRow = settingsRes.data as SettingsRow | null;
  if (!settingsRow) {
    const { data: inserted } = await client
      .from("settings")
      .insert({ kos_id: kosId })
      .select("*")
      .single();
    settingsRow = inserted as SettingsRow | null;
  }
  if (!settingsRow) throw new Error("Pengaturan kos tidak dapat dimuat.");

  const profileRow = profileRes.data as ProfileRow | null;

  const profile: ProfileInfo = {
    id: user.id,
    fullName: profileRow?.full_name ?? "Pemilik Kos",
    role: profileRow?.role ?? "Pemilik Kos",
    kosName: kosRow.name,
    phone: profileRow?.phone ?? null,
  };

  const kos: Kos = {
    id: kosRow.id,
    ownerId: kosRow.owner_id,
    name: kosRow.name,
    address: kosRow.address,
    cctvUrl: kosRow.cctv_url,
  };

  return {
    source: "supabase",
    profile,
    kos,
    settings: mapSettings(settingsRow),
    rooms: ((roomsRes.data as RoomRow[] | null) ?? []).map(mapRoom),
    tenants: ((tenantsRes.data as TenantRow[] | null) ?? []).map(mapTenant),
    payments: ((paymentsRes.data as PaymentRow[] | null) ?? []).map(mapPayment),
    notifications: ((notifRes.data as NotificationRowDb[] | null) ?? []).map(mapNotification),
    fetchedAt: new Date().toISOString(),
  };
}

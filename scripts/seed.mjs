import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SEED_EMAIL = process.env.SEED_EMAIL ?? "owner@smartkos.dev";
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "SmartKos#2026";
const OWNER_NAME = process.env.SEED_OWNER_NAME ?? "Bu Suwanti";
const OWNER_PHONE = process.env.SEED_OWNER_PHONE ?? "0812-3456-7890";
const KOS_NAME = process.env.SEED_KOS_NAME ?? "Kos Melati Harmoni";
const KOS_ADDRESS = process.env.SEED_KOS_ADDRESS ?? "Jl. Melati Raya No. 12, Jakarta Selatan";

const DEFAULT_RENT = 500000;
const RENT_DUE_DAY = 5;

const ROOM_SEEDS = [
  { number: "1", name: "Kamar 1", floor: 1, rent: 550_000, status: "occupied", tenant: { name: "Mas Bayu", phone: "0812-1111-2222", moveIn: "2026-01-10", rent: 550_000, dueDay: 5 } },
  { number: "2", name: "Kamar 2", floor: 1, rent: 550_000, status: "occupied", tenant: { name: "Mbak Ratih", phone: "0813-2222-3333", moveIn: "2026-02-15", rent: 550_000, dueDay: 5 } },
  { number: "3", name: "Kamar 3", floor: 1, rent: 500_000, status: "occupied", tenant: { name: "Mas Doni", phone: "0814-3333-4444", moveIn: "2026-03-01", rent: 500_000, dueDay: 5 } },
  { number: "4", name: "Kamar 4", floor: 2, rent: 600_000, status: "occupied", tenant: { name: "Mbak Dian", phone: "0815-4444-5555", moveIn: "2026-01-20", rent: 600_000, dueDay: 5 } },
  { number: "5", name: "Kamar 5", floor: 2, rent: 450_000, status: "vacant" },
  { number: "6", name: "Kamar 6", floor: 2, rent: 500_000, status: "vacant" },
];

const WA_TEMPLATE = `Halo {nama},

Tagihan sewa {kamar} ({kos}) periode {bulan}:
- Sewa bulanan: {jumlah}
- Jatuh tempo: {jatuhTempo}

Mohon dibayar sebelum jatuh tempo. Terima kasih.`;

function fail(message) {
  console.error(`\n[seed] ${message}\n`);
  process.exit(1);
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  fail("SUPABASE_URL (atau NEXT_PUBLIC_SUPABASE_URL) dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di .env.local.\nJalankan: node --env-file=.env.local scripts/seed.mjs");
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureUser() {
  const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`Gagal membaca daftar user: ${error.message}`);

  const existing = list.users.find((u) => u.email?.toLowerCase() === SEED_EMAIL.toLowerCase());
  if (existing) {
    console.log(`[seed] User sudah ada: ${SEED_EMAIL}`);
    return existing.id;
  }

  const { data, error: createError } = await admin.auth.admin.createUser({
    email: SEED_EMAIL,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: OWNER_NAME, role: "Pemilik Kos" },
  });
  if (createError || !data.user) throw new Error(`Gagal membuat user: ${createError?.message ?? "unknown"}`);
  console.log(`[seed] User dibuat: ${SEED_EMAIL}`);
  return data.user.id;
}

function periodKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dueDateFor(period, dueDay) {
  const [y, m] = period.split("-").map(Number);
  const day = Math.min(dueDay, 28);
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

async function main() {
  console.log("[seed] Mulai seeding data kos...\n");

  const userId = await ensureUser();

  const { error: profileError } = await admin.from("profiles").upsert(
    { id: userId, full_name: OWNER_NAME, role: "Pemilik Kos", phone: OWNER_PHONE },
    { onConflict: "id" },
  );
  if (profileError) throw new Error(`Gagal upsert profil: ${profileError.message}`);

  // kos
  const { data: existingKos } = await admin.from("kos").select("id").eq("owner_id", userId).order("created_at", { ascending: true }).limit(1).maybeSingle();
  let kosId = existingKos?.id;
  if (!kosId) {
    const { data: createdKos, error } = await admin.from("kos").insert({ owner_id: userId, name: KOS_NAME, address: KOS_ADDRESS }).select("id").single();
    if (error || !createdKos) throw new Error(`Gagal membuat kos: ${error?.message ?? "unknown"}`);
    kosId = createdKos.id;
  } else {
    await admin.from("kos").update({ name: KOS_NAME, address: KOS_ADDRESS }).eq("id", kosId);
  }
  console.log(`[seed] Kos: ${KOS_NAME} (${kosId})`);

  // settings
  const { error: settingsError } = await admin.from("settings").upsert(
    {
      kos_id: kosId,
      rent_due_day: RENT_DUE_DAY,
      default_rent: DEFAULT_RENT,
      notif_active: true,
      notif_reminder: true,
      notif_overdue: true,
      owner_phone: OWNER_PHONE,
      cctv_url: null,
      ui_mode: "classic",
      wa_template: WA_TEMPLATE,
    },
    { onConflict: "kos_id" },
  );
  if (settingsError) throw new Error(`Gagal upsert pengaturan: ${settingsError.message}`);

  // rooms
  const roomIds = [];
  for (let i = 0; i < ROOM_SEEDS.length; i += 1) {
    const r = ROOM_SEEDS[i];
    const { data: roomRow, error } = await admin.from("rooms").upsert(
      {
        kos_id: kosId,
        room_number: r.number,
        name: r.name,
        floor: r.floor,
        monthly_rent: r.rent,
        status: r.status,
        sort_order: i + 1,
      },
      { onConflict: "kos_id,room_number" },
    ).select("id").single();
    if (error || !roomRow) throw new Error(`Gagal upsert ${r.name}: ${error?.message ?? "unknown"}`);
    roomIds.push(roomRow.id);
  }
  console.log(`[seed] ${roomIds.length} kamar siap.`);

  // tenants
  const tenantIds = [];
  for (let i = 0; i < ROOM_SEEDS.length; i += 1) {
    const r = ROOM_SEEDS[i];
    if (!r.tenant) { tenantIds.push(null); continue; }
    const roomId = roomIds[i];
    const { data: existing } = await admin.from("tenants").select("id").eq("room_id", roomId).maybeSingle();
    if (existing?.id) {
      const { error } = await admin.from("tenants").update({
        full_name: r.tenant.name,
        phone: r.tenant.phone,
        move_in_date: r.tenant.moveIn,
        monthly_rent: r.tenant.rent,
        due_day: r.tenant.dueDay,
      }).eq("id", existing.id);
      if (error) throw new Error(`Gagal update tenant: ${error.message}`);
      tenantIds.push(existing.id);
    } else {
      const { data: created, error } = await admin.from("tenants").insert({
        kos_id: kosId,
        room_id: roomId,
        full_name: r.tenant.name,
        phone: r.tenant.phone,
        move_in_date: r.tenant.moveIn,
        monthly_rent: r.tenant.rent,
        due_day: r.tenant.dueDay,
      }).select("id").single();
      if (error || !created) throw new Error(`Gagal buat tenant: ${error?.message ?? "unknown"}`);
      tenantIds.push(created.id);
    }
  }
  console.log(`[seed] ${tenantIds.filter(Boolean).length} penghuni siap.`);

  // payments: 3 bulan terakhir
  const now = new Date();
  const periods = [];
  for (let i = 2; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push(periodKey(d));
  }

  const occupiedIndices = ROOM_SEEDS.map((r, i) => (r.status === "occupied" ? i : -1)).filter((i) => i >= 0);

  let payCount = 0;
  for (const period of periods) {
    const isCurrent = period === periods[periods.length - 1];
    for (const idx of occupiedIndices) {
      const roomId = roomIds[idx];
      const tenantId = tenantIds[idx];
      const r = ROOM_SEEDS[idx];
      const amount = r.tenant.rent;
      const dueDay = r.tenant.dueDay;
      const dueDate = dueDateFor(period, dueDay);

      let status = "paid";
      let paidAt = new Date(dueDate).toISOString();
      if (isCurrent) {
        if (r.number === "1" || r.number === "4") {
          status = "paid";
          paidAt = new Date(now.getTime() - 1 * 86400000).toISOString();
        } else if (r.number === "3") {
          status = "overdue";
          paidAt = null;
        } else {
          status = "pending";
          paidAt = null;
        }
      } else {
        paidAt = new Date(new Date(dueDate).getTime() + 2 * 86400000).toISOString();
      }

      const { error } = await admin.from("payments").upsert(
        {
          kos_id: kosId,
          room_id: roomId,
          tenant_id: tenantId,
          period,
          amount,
          due_date: dueDate,
          paid_at: paidAt,
          status,
          method: status === "paid" ? "Transfer" : null,
        },
        { onConflict: "room_id,period" },
      );
      if (error) throw new Error(`Gagal insert payment: ${error.message}`);
      payCount += 1;
    }
  }
  console.log(`[seed] ${payCount} tagihan (3 bulan) siap.`);

  // notifications
  const currentPeriod = periods[periods.length - 1];
  const monthName = new Date().toLocaleString("id-ID", { month: "long" });
  const { error: notifError } = await admin.from("notifications").upsert(
    [
      {
        kos_id: kosId,
        type: "payment_overdue",
        severity: "danger",
        message: `Kamar 3 (Mas Doni) belum membayar sewa bulan ${monthName}. Jatuh tempo 5 ${monthName}.`,
        dedupe_key: `overdue-${currentPeriod}-3`,
      },
      {
        kos_id: kosId,
        type: "payment_reminder",
        severity: "warn",
        message: "Pengingat: 2 kamar jatuh tempo dalam 3 hari. Siapkan penagihan.",
        dedupe_key: `reminder-${currentPeriod}`,
      },
    ],
    { onConflict: "kos_id,dedupe_key" },
  );
  if (notifError) throw new Error(`Gagal insert notifikasi: ${notifError.message}`);

  console.log("\n[seed] Selesai.\n");
  console.log(`  Login     : ${SEED_EMAIL}`);
  console.log(`  Password  : ${SEED_PASSWORD}`);
  console.log(`  Kos ID    : ${kosId}`);
  console.log(`  Kamar     : 6 + Gudang`);
  console.log(`  Penghuni  : 4 terisi, 2 kosong`);
  console.log("\n  Jalankan: npm run dev  (lalu buka http://localhost:3000)\n");
}

main().catch((error) => {
  console.error(`\n[seed] Gagal: ${error instanceof Error ? error.message : error}\n`);
  process.exitCode = 1;
});

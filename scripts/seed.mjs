import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const INGEST_API_KEY = process.env.INGEST_API_KEY ?? "dev-smart-kos-g3-secret";

const SEED_EMAIL = process.env.SEED_EMAIL ?? "owner@smartkos.dev";
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "SmartKos#2026";
const OWNER_NAME = process.env.SEED_OWNER_NAME ?? "Bu Suwanti";
const OWNER_PHONE = process.env.SEED_OWNER_PHONE ?? "0812-3456-7890";
const KOS_NAME = process.env.SEED_KOS_NAME ?? "Kos Melati Harmoni";
const KOS_ADDRESS = process.env.SEED_KOS_ADDRESS ?? "Jl. Melati Raya No. 12, Jakarta Selatan";

const TARIFF = 1444.7;
const BUDGET = 850000;

const ROOM_SEEDS = [
  { name: "Kamar 1", tenant: "Mas Bayu", monthlyKwh: 142, currentWatt: 410 },
  { name: "Kamar 2", tenant: "Mbak Ratih", monthlyKwh: 185, currentWatt: 620 },
  { name: "Kamar 3", tenant: "Mas Doni", monthlyKwh: 65, currentWatt: 120 },
  { name: "Kamar 4", tenant: "Mbak Dian", monthlyKwh: 52.7, currentWatt: 95 },
];

const TOTAL_SEED_KWH = ROOM_SEEDS.reduce((acc, room) => acc + room.monthlyKwh, 0);
const LAST_SEVEN_DAYS = [9.6, 22.4, 16.8, 15.0, 14.1, 13.5, 12.2];

function fail(message) {
  console.error(`\n[seed] ${message}\n`);
  process.exit(1);
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  fail(
    "NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di .env.local.\n" +
      "Jalankan: node --env-file=.env.local scripts/seed.mjs",
  );
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function toDateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function seededNoise(date) {
  const seed = date.getFullYear() * 372 + (date.getMonth() + 1) * 31 + date.getDate();
  return Math.sin(seed);
}

function buildSummaries(kosId, roomIds, now) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const rows = [];

  for (let offset = 29; offset >= 0; offset -= 1) {
    const date = new Date(today.getTime());
    date.setDate(date.getDate() - offset);
    const dateKey = toDateKey(date);

    let kwh;
    if (offset <= 6) {
      kwh = LAST_SEVEN_DAYS[offset];
    } else if (date.getTime() >= monthStart.getTime()) {
      kwh = 21.3 + seededNoise(date) * 1.6;
    } else {
      kwh = 17.6 + seededNoise(date) * 2.4;
    }
    kwh = round(Math.max(2, kwh), 3);

    rows.push({
      kos_id: kosId,
      room_id: null,
      date: dateKey,
      total_kwh: kwh,
      total_rupiah: round(kwh * TARIFF, 2),
    });

    ROOM_SEEDS.forEach((room, index) => {
      const share = room.monthlyKwh / TOTAL_SEED_KWH;
      const roomKwh = round(kwh * share, 3);
      rows.push({
        kos_id: kosId,
        room_id: roomIds[index],
        date: dateKey,
        total_kwh: roomKwh,
        total_rupiah: round(roomKwh * TARIFF, 2),
      });
    });
  }

  return rows;
}

async function ensureUser() {
  const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`Gagal membaca daftar user: ${error.message}`);

  const existing = list.users.find(
    (user) => user.email?.toLowerCase() === SEED_EMAIL.toLowerCase(),
  );

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

  if (createError || !data.user) {
    throw new Error(`Gagal membuat user: ${createError?.message ?? "unknown"}`);
  }

  console.log(`[seed] User dibuat: ${SEED_EMAIL}`);
  return data.user.id;
}

async function main() {
  console.log("[seed] Mulai seeding data demo...\n");

  const userId = await ensureUser();

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      full_name: OWNER_NAME,
      role: "Pemilik Kos",
      phone: OWNER_PHONE,
    },
    { onConflict: "id" },
  );
  if (profileError) throw new Error(`Gagal upsert profil: ${profileError.message}`);

  const { data: existingKos, error: kosSelectError } = await admin
    .from("kos")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (kosSelectError) throw new Error(`Gagal membaca kos: ${kosSelectError.message}`);

  let kosId = existingKos?.id;

  if (!kosId) {
    const { data: createdKos, error: kosInsertError } = await admin
      .from("kos")
      .insert({ owner_id: userId, name: KOS_NAME, address: KOS_ADDRESS })
      .select("id")
      .single();
    if (kosInsertError || !createdKos) {
      throw new Error(`Gagal membuat kos: ${kosInsertError?.message ?? "unknown"}`);
    }
    kosId = createdKos.id;
  } else {
    await admin
      .from("kos")
      .update({ name: KOS_NAME, address: KOS_ADDRESS })
      .eq("id", kosId);
  }
  console.log(`[seed] Kos: ${KOS_NAME} (${kosId})`);

  const { error: settingsError } = await admin.from("settings").upsert(
    {
      kos_id: kosId,
      budget_limit: BUDGET,
      tariff_per_kwh: TARIFF,
      wa_number: OWNER_PHONE,
      warn_threshold: 75,
      danger_threshold: 95,
    },
    { onConflict: "kos_id" },
  );
  if (settingsError) throw new Error(`Gagal upsert pengaturan: ${settingsError.message}`);

  const roomIds = [];
  for (let index = 0; index < ROOM_SEEDS.length; index += 1) {
    const room = ROOM_SEEDS[index];
    const { data: roomRow, error: roomError } = await admin
      .from("rooms")
      .upsert(
        {
          kos_id: kosId,
          name: room.name,
          tenant_name: room.tenant,
          sort_order: index + 1,
          mcb_limit_amp: 10,
          relay_on: true,
        },
        { onConflict: "kos_id,name" },
      )
      .select("id")
      .single();
    if (roomError || !roomRow) {
      throw new Error(`Gagal upsert ${room.name}: ${roomError?.message ?? "unknown"}`);
    }
    roomIds.push(roomRow.id);
  }
  console.log(`[seed] ${roomIds.length} kamar siap.`);

  const apiKeyHash = createHash("sha256").update(INGEST_API_KEY).digest("hex");
  const { data: existingDevices, error: devicesSelectError } = await admin
    .from("devices")
    .select("id, room_id")
    .eq("kos_id", kosId);
  if (devicesSelectError) {
    throw new Error(`Gagal membaca device: ${devicesSelectError.message}`);
  }

  const deviceIds = [];
  for (let index = 0; index < ROOM_SEEDS.length; index += 1) {
    const roomId = roomIds[index];
    const existing = existingDevices?.find((device) => device.room_id === roomId);
    if (existing) {
      const { error } = await admin
        .from("devices")
        .update({ name: `PZEM ${ROOM_SEEDS[index].name}`, api_key_hash: apiKeyHash })
        .eq("id", existing.id);
      if (error) throw new Error(`Gagal update device: ${error.message}`);
      deviceIds.push(existing.id);
    } else {
      const { data: created, error } = await admin
        .from("devices")
        .insert({
          kos_id: kosId,
          room_id: roomId,
          name: `PZEM ${ROOM_SEEDS[index].name}`,
          api_key_hash: apiKeyHash,
        })
        .select("id")
        .single();
      if (error || !created) throw new Error(`Gagal membuat device: ${error?.message ?? "unknown"}`);
      deviceIds.push(created.id);
    }
  }
  console.log(`[seed] ${deviceIds.length} device siap (api key di-hash SHA-256).`);

  const deviceFile = path.join(process.cwd(), "scripts", ".devices.json");
  await mkdir(path.dirname(deviceFile), { recursive: true });
  await writeFile(
    deviceFile,
    `${JSON.stringify(
      {
        kosId,
        apiKey: INGEST_API_KEY,
        devices: ROOM_SEEDS.map((room, index) => ({
          id: deviceIds[index],
          roomId: roomIds[index],
          roomName: room.name,
          baseWatt: room.currentWatt,
        })),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const now = new Date();
  const todayKey = toDateKey(now);
  const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  const startKey = toDateKey(thirtyDaysAgo);

  const { error: deleteSummariesError } = await admin
    .from("daily_summaries")
    .delete()
    .eq("kos_id", kosId)
    .gte("date", startKey);
  if (deleteSummariesError) {
    throw new Error(`Gagal reset ringkasan: ${deleteSummariesError.message}`);
  }

  const summaryRows = buildSummaries(kosId, roomIds, now);
  const { error: summariesError } = await admin.from("daily_summaries").insert(summaryRows);
  if (summariesError) throw new Error(`Gagal insert ringkasan: ${summariesError.message}`);
  console.log(`[seed] ${summaryRows.length} baris ringkasan harian (30 hari).`);

  const readingRows = ROOM_SEEDS.map((room, index) => {
    const voltage = round(220.4 + seededNoise(now) * 0.4, 1);
    return {
      kos_id: kosId,
      room_id: roomIds[index],
      device_id: deviceIds[index],
      ts: new Date(now.getTime() - 8_000).toISOString(),
      voltage,
      current: round(room.currentWatt / voltage, 2),
      power_watt: room.currentWatt,
      energy_kwh: round((room.currentWatt * 10) / 3_600_000, 5),
      frequency: 50,
      power_factor: 0.95,
    };
  });
  const { error: readingsError } = await admin.from("readings").insert(readingRows);
  if (readingsError) throw new Error(`Gagal insert reading: ${readingsError.message}`);

  const { error: notifError } = await admin.from("notifications").upsert(
    [
      {
        kos_id: kosId,
        type: "budget_waspada",
        severity: "warn",
        message:
          "Peringatan: Penggunaan listrik minggu ini lebih dari biasanya. Segera cek dashboard.",
        is_read: false,
        dedupe_key: `waspada-${todayKey}`,
        created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        kos_id: kosId,
        type: "device_online",
        severity: "info",
        message: "ESP32 & PZEM-004T terhubung kembali ke jaringan kos.",
        is_read: true,
        dedupe_key: `online-${todayKey}`,
        created_at: new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString(),
      },
    ],
    { onConflict: "kos_id,dedupe_key" },
  );
  if (notifError) throw new Error(`Gagal insert notifikasi: ${notifError.message}`);

  console.log("\n[seed] Selesai.\n");
  console.log(`  Login     : ${SEED_EMAIL}`);
  console.log(`  Password  : ${SEED_PASSWORD}`);
  console.log(`  Kos ID    : ${kosId}`);
  console.log(`  API key   : ${INGEST_API_KEY}`);
  console.log(`  Device ID : ${deviceIds.join(", ")}`);
  console.log("\n  Jalankan simulator: npm run simulate\n");
}

main().catch((error) => {
  console.error(`\n[seed] Gagal: ${error instanceof Error ? error.message : error}\n`);
  process.exitCode = 1;
});

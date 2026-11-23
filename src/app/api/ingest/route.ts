import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { DEMO_MODE, TARIF_PLN_DEFAULT } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const payloadSchema = z.object({
  device_id: z.uuid(),
  voltage: z.number().min(0).max(300).optional(),
  current: z.number().min(0).max(100).optional(),
  power_watt: z.number().min(0).max(20_000).optional(),
  energy_kwh: z.number().min(0).max(10).optional(),
  frequency: z.number().min(40).max(65).optional(),
  power_factor: z.number().min(0).max(1).optional(),
  ts: z.iso.datetime().optional(),
});

type DeviceRow = {
  id: string;
  kos_id: string;
  room_id: string | null;
  api_key_hash: string;
};

export async function POST(request: Request) {
  if (DEMO_MODE) {
    return NextResponse.json(
      { ok: false, error: "Mode demo aktif. Ingest hanya tersedia saat Supabase terhubung." },
      { status: 503 },
    );
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Server belum dikonfigurasi (service role key tidak ada)." },
      { status: 500 },
    );
  }

  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Header x-api-key wajib diisi." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body bukan JSON yang valid." }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Payload tidak valid.", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const payload = parsed.data;

  const { data: deviceData, error: deviceError } = await admin
    .from("devices")
    .select("id, kos_id, room_id, api_key_hash")
    .eq("id", payload.device_id)
    .maybeSingle();

  if (deviceError) {
    return NextResponse.json({ ok: false, error: deviceError.message }, { status: 500 });
  }

  const device = deviceData as DeviceRow | null;
  if (!device) {
    return NextResponse.json({ ok: false, error: "Perangkat tidak dikenal." }, { status: 404 });
  }

  const providedHash = createHash("sha256").update(apiKey).digest("hex");
  if (providedHash !== device.api_key_hash) {
    return NextResponse.json({ ok: false, error: "API key salah." }, { status: 401 });
  }

  const { data: settingsData } = await admin
    .from("settings")
    .select("tariff_per_kwh, budget_limit, warn_threshold, danger_threshold, notif_active, notif_waspada, notif_bahaya")
    .eq("kos_id", device.kos_id)
    .maybeSingle();

  const settingsRow = (settingsData as {
    tariff_per_kwh?: number | string;
    budget_limit?: number | string;
    warn_threshold?: number;
    danger_threshold?: number;
    notif_active?: boolean;
    notif_waspada?: boolean;
    notif_bahaya?: boolean;
  } | null);

  const tariffRaw = settingsRow?.tariff_per_kwh;
  const tariff = tariffRaw == null ? TARIF_PLN_DEFAULT : Number(tariffRaw);

  const { data: readingId, error: rpcError } = await admin.rpc("record_reading", {
    p_kos_id: device.kos_id,
    p_room_id: device.room_id,
    p_device_id: device.id,
    p_ts: payload.ts ?? new Date().toISOString(),
    p_voltage: payload.voltage ?? null,
    p_current: payload.current ?? null,
    p_power_watt: payload.power_watt ?? null,
    p_energy_kwh: payload.energy_kwh ?? 0,
    p_frequency: payload.frequency ?? null,
    p_power_factor: payload.power_factor ?? null,
    p_tariff: Number.isFinite(tariff) && tariff > 0 ? tariff : TARIF_PLN_DEFAULT,
  });

  if (rpcError) {
    return NextResponse.json({ ok: false, error: rpcError.message }, { status: 500 });
  }

  if (settingsRow?.notif_active) {
    try {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;

      const { data: summaryRows } = await admin
        .from("daily_summaries")
        .select("total_rupiah")
        .eq("kos_id", device.kos_id)
        .is("room_id", null)
        .gte("date", monthStart.toISOString().slice(0, 10));

      const monthlyCost = (summaryRows ?? []).reduce(
        (acc, row) => acc + Number((row as { total_rupiah?: number | string }).total_rupiah ?? 0),
        0,
      );
      const budgetLimit = Number(settingsRow.budget_limit ?? 850000);
      const ratio = budgetLimit > 0 ? (monthlyCost / budgetLimit) * 100 : 0;
      const warnThreshold = settingsRow.warn_threshold ?? 75;
      const dangerThreshold = settingsRow.danger_threshold ?? 95;

      if (ratio >= dangerThreshold && settingsRow.notif_bahaya) {
        await admin.from("notifications").upsert(
          {
            kos_id: device.kos_id,
            type: "budget_bahaya",
            severity: "danger",
            message: `Pemakaian telah mencapai ${ratio.toFixed(1)}% dari batas budget bulanan (${new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(Math.round(budgetLimit))}). Segera lakukan penghematan.`,
            dedupe_key: `budget-bahaya-${monthKey}`,
          },
          { onConflict: "kos_id,dedupe_key" },
        );
      } else if (ratio >= warnThreshold && settingsRow.notif_waspada) {
        await admin.from("notifications").upsert(
          {
            kos_id: device.kos_id,
            type: "budget_waspada",
            severity: "warn",
            message: `Pemakaian telah mencapai ${ratio.toFixed(1)}% dari batas budget bulanan. Pantau perangkat berdaya besar.`,
            dedupe_key: `budget-waspada-${monthKey}`,
          },
          { onConflict: "kos_id,dedupe_key" },
        );
      }
    } catch {
      // Notifikasi bersifat best-effort; jangan gagalkan ingest.
    }
  }

  return NextResponse.json({
    ok: true,
    reading_id: readingId,
    kos_id: device.kos_id,
    room_id: device.room_id,
    ts: payload.ts ?? new Date().toISOString(),
  });
}

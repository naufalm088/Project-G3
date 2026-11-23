import { readFile } from "node:fs/promises";
import path from "node:path";

const APP_URL = (process.env.SIMULATOR_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const INTERVAL_MS = Number.parseInt(process.env.SIMULATOR_INTERVAL_MS ?? "5000", 10);
const DEVICE_FILE = path.join(process.cwd(), "scripts", ".devices.json");

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

async function loadDevices() {
  try {
    const raw = await readFile(DEVICE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.devices) || parsed.devices.length === 0) {
      throw new Error("daftar perangkat kosong");
    }
    return {
      apiKey: parsed.apiKey ?? process.env.INGEST_API_KEY ?? "dev-smart-kos-g3-secret",
      devices: parsed.devices,
    };
  } catch (error) {
    throw new Error(
      `Tidak bisa membaca ${DEVICE_FILE} (${error instanceof Error ? error.message : error}). ` +
        "Jalankan dulu: npm run seed",
    );
  }
}

let devices;
let apiKey;

async function postReading(device) {
  const jitter = 1 + (Math.random() - 0.5) * 0.22;
  const powerWatt = Math.max(20, round(device.baseWatt * jitter, 1));
  const voltage = round(220 + (Math.random() - 0.5) * 4, 1);
  const current = round(powerWatt / voltage, 3);
  const energyKwh = round((powerWatt * (INTERVAL_MS / 1000)) / 3_600_000, 6);

  const response = await fetch(`${APP_URL}/api/ingest`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      device_id: device.id,
      voltage,
      current,
      power_watt: powerWatt,
      energy_kwh: energyKwh,
      frequency: round(50 + (Math.random() - 0.5) * 0.06, 2),
      power_factor: round(0.92 + Math.random() * 0.06, 3),
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status} ${text.slice(0, 160)}`);
  }
}

let running = true;

async function tick() {
  const startedAt = Date.now();
  const results = await Promise.allSettled(devices.map((device) => postReading(device)));
  const stamp = new Date().toLocaleTimeString("id-ID");
  const line = results
    .map((result, index) => {
      const name = devices[index].roomName;
      return result.status === "fulfilled" ? `${name}: ok` : `${name}: ${result.reason}`;
    })
    .join(" | ");
  console.log(`[${stamp}] ${line}`);

  const elapsed = Date.now() - startedAt;
  if (running) {
    setTimeout(tick, Math.max(500, INTERVAL_MS - elapsed));
  }
}

async function main() {
  const loaded = await loadDevices();
  devices = loaded.devices;
  apiKey = loaded.apiKey;

  console.log(`[simulator] Target   : ${APP_URL}/api/ingest`);
  console.log(`[simulator] Interval : ${INTERVAL_MS} ms`);
  console.log(`[simulator] Devices  : ${devices.map((device) => device.roomName).join(", ")}`);
  console.log("[simulator] Tekan Ctrl+C untuk berhenti.\n");

  process.on("SIGINT", () => {
    running = false;
    console.log("\n[simulator] Dihentikan.");
    process.exit(0);
  });

  await tick();
}

main().catch((error) => {
  console.error(`\n[simulator] Gagal: ${error instanceof Error ? error.message : error}\n`);
  process.exit(1);
});

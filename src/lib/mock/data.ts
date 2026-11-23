import { DEMO_PROFILE } from "@/lib/app-constants";
import { TARIF_PLN_DEFAULT } from "@/lib/config";
import { addDays, startOfDay, startOfMonth, toDateKey } from "@/lib/date";
import type {
  AppData,
  DailySummary,
  Device,
  NotificationRow,
  Reading,
  Room,
} from "@/lib/types";

const DEMO_KOS_ID = "demo-kos";
const TARIF = TARIF_PLN_DEFAULT;

type RoomSeed = {
  id: string;
  name: string;
  tenant: string;
  monthlyKwh: number;
  currentWatt: number;
  mcbLimitAmp: number;
};

const ROOM_SEEDS: RoomSeed[] = [
  { id: "demo-room-1", name: "Kamar 1", tenant: "Mas Bayu", monthlyKwh: 142, currentWatt: 410, mcbLimitAmp: 10 },
  { id: "demo-room-2", name: "Kamar 2", tenant: "Mbak Ratih", monthlyKwh: 185, currentWatt: 620, mcbLimitAmp: 10 },
  { id: "demo-room-3", name: "Kamar 3", tenant: "Mas Doni", monthlyKwh: 65, currentWatt: 120, mcbLimitAmp: 10 },
  { id: "demo-room-4", name: "Kamar 4", tenant: "Mbak Dian", monthlyKwh: 52.7, currentWatt: 95, mcbLimitAmp: 10 },
];

const TOTAL_SEED_KWH = ROOM_SEEDS.reduce((acc, room) => acc + room.monthlyKwh, 0);

const LAST_SEVEN_DAYS = [9.6, 22.4, 16.8, 15.0, 14.1, 13.5, 12.2];

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function seededNoise(date: Date): number {
  const seed = date.getFullYear() * 372 + (date.getMonth() + 1) * 31 + date.getDate();
  return Math.sin(seed);
}

export function buildDemoAppData(now = new Date()): AppData {
  const today = startOfDay(now);
  const monthStart = startOfMonth(today);
  const summaries: DailySummary[] = [];

  for (let offset = 29; offset >= 0; offset -= 1) {
    const date = addDays(today, -offset);
    let kwh: number;

    if (offset <= 6) {
      kwh = LAST_SEVEN_DAYS[offset];
    } else if (date.getTime() >= monthStart.getTime()) {
      kwh = 21.3 + seededNoise(date) * 1.6;
    } else {
      kwh = 17.6 + seededNoise(date) * 2.4;
    }

    kwh = round(Math.max(2, kwh), 3);
    const dateKey = toDateKey(date);

    summaries.push({
      kosId: DEMO_KOS_ID,
      roomId: null,
      date: dateKey,
      totalKwh: kwh,
      totalRupiah: round(kwh * TARIF, 2),
    });

    for (const room of ROOM_SEEDS) {
      const share = room.monthlyKwh / TOTAL_SEED_KWH;
      const roomKwh = round(kwh * share, 3);
      summaries.push({
        kosId: DEMO_KOS_ID,
        roomId: room.id,
        date: dateKey,
        totalKwh: roomKwh,
        totalRupiah: round(roomKwh * TARIF, 2),
      });
    }
  }

  const rooms: Room[] = ROOM_SEEDS.map((seed, index) => ({
    id: seed.id,
    kosId: DEMO_KOS_ID,
    name: seed.name,
    tenantName: seed.tenant,
    sortOrder: index + 1,
    mcbLimitAmp: seed.mcbLimitAmp,
    relayOn: true,
  }));

  const devices: Device[] = ROOM_SEEDS.map((seed, index) => ({
    id: `demo-device-${index + 1}`,
    kosId: DEMO_KOS_ID,
    roomId: seed.id,
    name: `PZEM ${seed.name}`,
    lastSeenAt: new Date(now.getTime() - 8_000).toISOString(),
    isOnline: true,
  }));

  const latestReadings: Record<string, Reading | undefined> = {};
  ROOM_SEEDS.forEach((seed, index) => {
    const voltage = round(220.4 + seededNoise(new Date(now.getTime() - index)) * 0.4, 1);
    const current = round(seed.currentWatt / voltage, 2);
    latestReadings[seed.id] = {
      id: `demo-reading-${index + 1}`,
      kosId: DEMO_KOS_ID,
      roomId: seed.id,
      deviceId: `demo-device-${index + 1}`,
      ts: new Date(now.getTime() - 8_000).toISOString(),
      voltage,
      current,
      powerWatt: seed.currentWatt,
      energyKwh: 0,
      frequency: 50,
      powerFactor: 0.95,
    };
  });

  const notifications: NotificationRow[] = [
    {
      id: "demo-notif-1",
      kosId: DEMO_KOS_ID,
      type: "budget_waspada",
      severity: "warn",
      message:
        "Peringatan: Penggunaan listrik minggu ini lebih dari biasanya. Segera cek dashboard.",
      isRead: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "demo-notif-2",
      kosId: DEMO_KOS_ID,
      type: "device_online",
      severity: "info",
      message: "ESP32 & PZEM-004T terhubung kembali ke jaringan kos.",
      isRead: true,
      createdAt: new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return {
    source: "demo",
    profile: DEMO_PROFILE,
    kos: {
      id: DEMO_KOS_ID,
      ownerId: DEMO_PROFILE.id,
      name: DEMO_PROFILE.kosName,
      address: "Jl. Melati Raya No. 12, Jakarta Selatan",
    },
    settings: {
      id: "demo-settings",
      kosId: DEMO_KOS_ID,
      budgetLimit: 850_000,
      tariffPerKwh: TARIF,
      notifActive: true,
      notifWaspada: true,
      notifBahaya: true,
      warnThreshold: 75,
      dangerThreshold: 95,
      notifWa: true,
      notifPush: true,
      waNumber: DEMO_PROFILE.phone,
      updatedAt: now.toISOString(),
    },
    rooms,
    devices,
    latestReadings,
    summaries,
    notifications,
    fetchedAt: now.toISOString(),
  };
}

import { DEMO_PROFILE } from "@/lib/app-constants";
// (date helpers not needed in mock data)
import type {
  AppData,
  Kos,
  NotificationRow,
  Payment,
  Room,
  Settings,
  Tenant,
} from "@/lib/types";

const DEMO_KOS_ID = "demo-kos";
const OWNER_PHONE = DEMO_PROFILE.phone;

const ROOM_SEEDS: {
  number: string;
  name: string;
  floor: number;
  rent: number;
  status: "occupied" | "vacant" | "maintenance";
  tenant?: { name: string; phone: string; moveIn: string; rent?: number; dueDay: number };
}[] = [
  { number: "1", name: "Kamar 1", floor: 1, rent: 550_000, status: "occupied", tenant: { name: "Mas Bayu", phone: "0812-1111-2222", moveIn: "2026-01-10", dueDay: 5 } },
  { number: "2", name: "Kamar 2", floor: 1, rent: 550_000, status: "occupied", tenant: { name: "Mbak Ratih", phone: "0813-2222-3333", moveIn: "2026-02-15", dueDay: 5 } },
  { number: "3", name: "Kamar 3", floor: 1, rent: 500_000, status: "occupied", tenant: { name: "Mas Doni", phone: "0814-3333-4444", moveIn: "2026-03-01", dueDay: 5 } },
  { number: "4", name: "Kamar 4", floor: 2, rent: 600_000, status: "occupied", tenant: { name: "Mbak Dian", phone: "0815-4444-5555", moveIn: "2026-01-20", dueDay: 5 } },
  { number: "5", name: "Kamar 5", floor: 2, rent: 450_000, status: "vacant" },
  { number: "6", name: "Kamar 6", floor: 2, rent: 500_000, status: "vacant" },
];

function periodKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dueDateFor(period: string, dueDay: number): string {
  const [y, m] = period.split("-").map(Number);
  const day = Math.min(dueDay, 28);
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function buildDemoAppData(now = new Date()): AppData {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentPeriod = periodKey(today);

  const nowIso = now.toISOString();
  const rooms: Room[] = ROOM_SEEDS.map((seed, index) => ({
    id: `demo-room-${index + 1}`,
    kosId: DEMO_KOS_ID,
    number: seed.number,
    name: seed.name,
    floor: seed.floor,
    monthlyRent: seed.rent,
    status: seed.status,
    sortOrder: index + 1,
    createdAt: nowIso,
  }));

  // gudang
  rooms.push({
    id: "demo-room-g",
    kosId: DEMO_KOS_ID,
    number: "G",
    name: "Gudang",
    floor: 1,
    monthlyRent: 0,
    status: "maintenance",
    sortOrder: 7,
    createdAt: nowIso,
  });

  const tenants: Tenant[] = ROOM_SEEDS.filter((s) => s.tenant).map((seed, index) => ({
    id: `demo-tenant-${index + 1}`,
    kosId: DEMO_KOS_ID,
    roomId: `demo-room-${index + 1}`,
    fullName: seed.tenant!.name,
    phone: seed.tenant!.phone,
    moveInDate: seed.tenant!.moveIn,
    monthlyRent: seed.tenant!.rent ?? null,
    dueDay: seed.tenant!.dueDay,
    notes: null,
    createdAt: new Date().toISOString(),
  }));

  const tenantByRoom = new Map(tenants.map((t) => [t.roomId, t]));

  // payments: 3 bulan terakhir
  const periods: string[] = [];
  for (let i = 2; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    periods.push(periodKey(d));
  }

  const payments: Payment[] = [];
  let pid = 1;
  for (const period of periods) {
    const isCurrent = period === currentPeriod;
    for (const room of rooms) {
      if (room.status !== "occupied") continue;
      const tenant = tenantByRoom.get(room.id);
      if (!tenant) continue;
      const amount = tenant.monthlyRent ?? room.monthlyRent;
      const dueDay = tenant.dueDay;
      const dueDate = dueDateFor(period, dueDay);
      const dueDateObj = new Date(dueDate);
      let status: Payment["status"] = "pending";
      let paidAt: string | null = null;

      if (!isCurrent) {
        status = "paid";
        paidAt = new Date(dueDateObj.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
      } else {
        // current month: room 1 & 4 paid, room 2 pending, room 3 overdue
        if (room.number === "1" || room.number === "4") {
          status = "paid";
          paidAt = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
        } else if (room.number === "3") {
          status = "overdue";
        } else {
          status = "pending";
        }
      }

      payments.push({
        id: `demo-pay-${pid++}`,
        kosId: DEMO_KOS_ID,
        roomId: room.id,
        tenantId: tenant.id,
        period,
        amount,
        dueDate,
        paidAt,
        status,
        method: status === "paid" ? "Transfer" : null,
        notes: null,
        createdAt: new Date().toISOString(),
      });
    }
  }

  const notifications: NotificationRow[] = [
    {
      id: "demo-notif-1",
      kosId: DEMO_KOS_ID,
      type: "payment_overdue",
      severity: "danger",
      message: "Kamar 3 (Mas Doni) belum membayar sewa bulan ini. Jatuh tempo 5 " + new Date(today.getFullYear(), today.getMonth(), 1).toLocaleString("id-ID", { month: "long" }) + ".",
      isRead: false,
      createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "demo-notif-2",
      kosId: DEMO_KOS_ID,
      type: "payment_reminder",
      severity: "warn",
      message: "Pengingat: 2 kamar jatuh tempo dalam 3 hari. Siapkan penagihan.",
      isRead: false,
      createdAt: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const kos: Kos = {
    id: DEMO_KOS_ID,
    ownerId: DEMO_PROFILE.id,
    name: DEMO_PROFILE.kosName,
    address: "Jl. Melati Raya No. 12, Jakarta Selatan",
    cctvUrl: null,
  };

  const settings: Settings = {
    id: "demo-settings",
    kosId: DEMO_KOS_ID,
    rentDueDay: 5,
    defaultRent: 500_000,
    notifActive: true,
    notifReminder: true,
    notifOverdue: true,
    ownerPhone: OWNER_PHONE,
    cctvUrl: null,
    uiMode: "classic",
    waTemplate: "Halo {nama},\n\nTagihan sewa {kamar} ({kos}) periode {bulan}:\n- Sewa bulanan: {jumlah}\n- Jatuh tempo: {jatuhTempo}\n\nMohon dibayar sebelum jatuh tempo. Terima kasih.",
    updatedAt: now.toISOString(),
  };

  return {
    source: "demo",
    profile: DEMO_PROFILE,
    kos,
    settings,
    rooms,
    tenants,
    payments,
    notifications,
    fetchedAt: now.toISOString(),
  };
}

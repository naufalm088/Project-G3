// date helpers not needed here
import { formatPeriod } from "@/lib/format";
import type {
  AppData,
  DashboardView,
  IncomePoint,
  Payment,
  PaymentHistoryView,
  PaymentStatus,
  RoomDetailView,
  RoomMetric,
} from "@/lib/types";

export type PaymentFilter = {
  period?: string; // "YYYY-MM" or "all"
  roomId?: string;
  status?: PaymentStatus | "all";
};

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus | "all"; label: string }[] = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Belum Bayar" },
  { value: "paid", label: "Lunas" },
  { value: "overdue", label: "Jatuh Tempo" },
];

export function currentPeriod(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function effectiveRent(room: AppData["rooms"][number], tenant: AppData["tenants"][number] | undefined): number {
  if (tenant?.monthlyRent && tenant.monthlyRent > 0) return tenant.monthlyRent;
  return room.monthlyRent;
}

function tenantForRoom(data: AppData, roomId: string): AppData["tenants"][number] | undefined {
  return data.tenants.find((t) => t.roomId === roomId);
}

function paymentForRoomPeriod(data: AppData, roomId: string, period: string): Payment | undefined {
  return data.payments.find((p) => p.roomId === roomId && p.period === period);
}

function computePaymentStatus(payment: Payment | undefined, today: Date): PaymentStatus | "none" {
  if (!payment) return "none";
  if (payment.status === "paid") return "paid";
  const due = new Date(payment.dueDate);
  if (due.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) {
    return "overdue";
  }
  return "pending";
}

export function selectRoomMetrics(data: AppData, now = new Date()): RoomMetric[] {
  const period = currentPeriod(now);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return data.rooms
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((room) => {
      const tenant = tenantForRoom(data, room.id);
      const rent = effectiveRent(room, tenant);
      const payment = paymentForRoomPeriod(data, room.id, period);
      const paymentStatus = computePaymentStatus(payment, today);
      return { room, tenant: tenant ?? null, effectiveRent: rent, payment: payment ?? null, paymentStatus };
    });
}

export function selectDashboard(data: AppData, now = new Date()): DashboardView {
  const period = currentPeriod(now);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const rooms = selectRoomMetrics(data, now);

  const occupiedRooms = rooms.filter((m) => m.room.status === "occupied");
  const target = occupiedRooms.reduce((acc, m) => acc + m.effectiveRent, 0);

  const paymentsThisMonth = data.payments.filter((p) => p.period === period);
  const collected = paymentsThisMonth
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => acc + p.amount, 0);
  const pending = paymentsThisMonth
    .filter((p) => p.status === "pending")
    .reduce((acc, p) => acc + p.amount, 0);
  const overdue = paymentsThisMonth
    .filter((p) => p.status === "overdue")
    .reduce((acc, p) => acc + p.amount, 0);

  // payments whose due_date passed but still pending -> overdue
  let overdueAdjusted = overdue;
  let pendingAdjusted = pending;
  for (const p of paymentsThisMonth) {
    if (p.status === "pending") {
      const due = new Date(p.dueDate);
      if (due.getTime() < today.getTime()) {
        overdueAdjusted += p.amount;
        pendingAdjusted -= p.amount;
      }
    }
  }

  const counts = {
    total: data.rooms.length,
    occupied: data.rooms.filter((r) => r.status === "occupied").length,
    vacant: data.rooms.filter((r) => r.status === "vacant").length,
    maintenance: data.rooms.filter((r) => r.status === "maintenance").length,
    overdue: paymentsThisMonth.filter((p) => {
      if (p.status === "overdue") return true;
      if (p.status === "pending") {
        return new Date(p.dueDate).getTime() < today.getTime();
      }
      return false;
    }).length,
    pending: paymentsThisMonth.filter((p) => p.status === "pending" && new Date(p.dueDate).getTime() >= today.getTime()).length,
  };

  // income history: last 6 months
  const historyMonths: string[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    historyMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const incomeHistory: IncomePoint[] = historyMonths.map((per) => {
    const collectedForPeriod = data.payments
      .filter((p) => p.period === per && p.status === "paid")
      .reduce((acc, p) => acc + p.amount, 0);
    return {
      period: per,
      label: formatPeriod(per),
      collected: collectedForPeriod,
      target,
    };
  });

  return {
    profile: data.profile,
    kosName: data.kos.name,
    settings: data.settings,
    rooms,
    counts,
    monthlyIncome: {
      period,
      target,
      collected,
      pending: pendingAdjusted,
      overdue: overdueAdjusted,
    },
    incomeHistory,
    notifications: data.notifications,
    cctvUrl: data.settings.cctvUrl ?? data.kos.cctvUrl,
    uiMode: data.settings.uiMode,
  };
}

export function selectRoomDetail(data: AppData, roomId: string, now = new Date()): RoomDetailView | null {
  const room = data.rooms.find((r) => r.id === roomId);
  if (!room) return null;
  const tenant = data.tenants.find((t) => t.roomId === roomId) ?? null;
  const payments = data.payments
    .filter((p) => p.roomId === roomId)
    .slice()
    .sort((a, b) => (a.period < b.period ? 1 : -1));
  const period = currentPeriod(now);
  const currentPayment = payments.find((p) => p.period === period) ?? null;
  return { room, tenant, payments, currentPayment };
}

export function selectPayments(data: AppData, filter: PaymentFilter = {}, now = new Date()): Payment[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let list = data.payments.slice();

  if (filter.period && filter.period !== "all") {
    list = list.filter((p) => p.period === filter.period);
  }
  if (filter.roomId) {
    list = list.filter((p) => p.roomId === filter.roomId);
  }
  if (filter.status && filter.status !== "all") {
    list = list.filter((p) => {
      const s = p.status === "pending" && new Date(p.dueDate).getTime() < today.getTime() ? "overdue" : p.status;
      return s === filter.status;
    });
  }

  return list.sort((a, b) => (a.period < b.period ? 1 : a.period > b.period ? -1 : a.roomId.localeCompare(b.roomId)));
}

export function selectPaymentHistory(data: AppData): PaymentHistoryView {
  const payments = data.payments.slice().sort((a, b) => (a.period < b.period ? 1 : -1));
  const totalCollected = payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((a, p) => a + p.amount, 0);
  const totalOverdue = payments.filter((p) => p.status === "overdue").reduce((a, p) => a + p.amount, 0);
  return {
    payments,
    rooms: data.rooms,
    tenants: data.tenants,
    totalCollected,
    totalPending,
    totalOverdue,
  };
}

export function periodsAvailable(data: AppData): string[] {
  const set = new Set(data.payments.map((p) => p.period));
  return Array.from(set).sort().reverse();
}

export type DataSource = "demo" | "supabase";

export type StatusTone = "safe" | "warn" | "danger" | "neutral";

export type UiMode = "classic" | "modern";

export type RoomStatus = "occupied" | "vacant" | "maintenance";

export type PaymentStatus = "pending" | "paid" | "overdue";

export type ProfileInfo = {
  id: string;
  fullName: string;
  role: string;
  kosName: string;
  phone: string | null;
};

export type Kos = {
  id: string;
  ownerId: string;
  name: string;
  address: string | null;
  cctvUrl: string | null;
};

export type Room = {
  id: string;
  kosId: string;
  number: string;
  name: string;
  floor: number;
  monthlyRent: number;
  status: RoomStatus;
  sortOrder: number;
  createdAt: string;
};

export type Tenant = {
  id: string;
  kosId: string;
  roomId: string;
  fullName: string;
  phone: string | null;
  moveInDate: string | null;
  monthlyRent: number | null;
  dueDay: number;
  notes: string | null;
  createdAt: string;
};

export type Payment = {
  id: string;
  kosId: string;
  roomId: string;
  tenantId: string | null;
  period: string; // "YYYY-MM"
  amount: number;
  dueDate: string; // ISO date
  paidAt: string | null;
  status: PaymentStatus;
  method: string | null;
  notes: string | null;
  createdAt: string;
};

export type Settings = {
  id: string;
  kosId: string;
  rentDueDay: number;
  defaultRent: number;
  notifActive: boolean;
  notifReminder: boolean;
  notifOverdue: boolean;
  ownerPhone: string | null;
  cctvUrl: string | null;
  uiMode: UiMode;
  waTemplate: string | null;
  updatedAt: string;
};

export type NotificationRow = {
  id: string;
  kosId: string;
  type: string;
  severity: "info" | "warn" | "danger";
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type RoomMetric = {
  room: Room;
  tenant: Tenant | null;
  effectiveRent: number;
  payment: Payment | null;
  paymentStatus: PaymentStatus | "none";
};

export type IncomePoint = {
  period: string; // "YYYY-MM"
  label: string; // "Nov 2026"
  collected: number;
  target: number;
};

export type DashboardView = {
  profile: ProfileInfo;
  kosName: string;
  settings: Settings;
  rooms: RoomMetric[];
  counts: {
    total: number;
    occupied: number;
    vacant: number;
    maintenance: number;
    overdue: number;
    pending: number;
  };
  monthlyIncome: {
    period: string;
    target: number;
    collected: number;
    pending: number;
    overdue: number;
  };
  incomeHistory: IncomePoint[];
  notifications: NotificationRow[];
  cctvUrl: string | null;
  uiMode: UiMode;
};

export type RoomDetailView = {
  room: Room;
  tenant: Tenant | null;
  payments: Payment[];
  currentPayment: Payment | null;
};

export type PaymentHistoryView = {
  payments: Payment[];
  rooms: Room[];
  tenants: Tenant[];
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
};

export type AppData = {
  source: DataSource;
  profile: ProfileInfo;
  kos: Kos;
  settings: Settings;
  rooms: Room[];
  tenants: Tenant[];
  payments: Payment[];
  notifications: NotificationRow[];
  fetchedAt: string;
};

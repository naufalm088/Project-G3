export type StatusTone = "safe" | "warn" | "danger" | "neutral";

export type DataSource = "demo" | "supabase";

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
};

export type Room = {
  id: string;
  kosId: string;
  name: string;
  tenantName: string | null;
  sortOrder: number;
  mcbLimitAmp: number;
  relayOn: boolean;
};

export type Device = {
  id: string;
  kosId: string;
  roomId: string | null;
  name: string;
  lastSeenAt: string | null;
  isOnline: boolean;
};

export type Reading = {
  id: number | string;
  kosId: string;
  roomId: string | null;
  deviceId: string | null;
  ts: string;
  voltage: number | null;
  current: number | null;
  powerWatt: number | null;
  energyKwh: number;
  frequency: number | null;
  powerFactor: number | null;
};

export type DailySummary = {
  id?: string;
  kosId: string;
  roomId: string | null;
  date: string;
  totalKwh: number;
  totalRupiah: number;
};

export type Settings = {
  id: string;
  kosId: string;
  budgetLimit: number;
  tariffPerKwh: number;
  notifActive: boolean;
  notifWaspada: boolean;
  notifBahaya: boolean;
  warnThreshold: number;
  dangerThreshold: number;
  notifWa: boolean;
  notifPush: boolean;
  waNumber: string | null;
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

export type AppData = {
  source: DataSource;
  profile: ProfileInfo;
  kos: Kos;
  settings: Settings;
  rooms: Room[];
  devices: Device[];
  latestReadings: Record<string, Reading | undefined>;
  summaries: DailySummary[];
  notifications: NotificationRow[];
  fetchedAt: string;
};

export type RoomMetric = {
  room: Room;
  monthlyKwh: number;
  monthlyCost: number;
  currentWatt: number;
  latest: Reading | undefined;
  tone: StatusTone;
  shareOfTotal: number;
  isTopConsumer: boolean;
};

export type DashboardView = {
  profile: ProfileInfo;
  kosName: string;
  settings: Settings;
  rooms: RoomMetric[];
  monthlyKwh: number;
  monthlyCost: number;
  budgetLimit: number;
  budgetRatio: number;
  tone: StatusTone;
  statusLabel: string;
  totalWatt: number;
  totalCurrent: number;
  voltage: number | null;
  frequency: number | null;
  lastReadingAt: string | null;
  deviceOnline: boolean;
  isStale: boolean;
  roomCount: number;
  notifications: NotificationRow[];
};

export type HistoryDay = {
  date: string;
  kwh: number;
  rupiah: number;
  isToday: boolean;
  isMissing: boolean;
};

export type HistoryView = {
  days: HistoryDay[];
  rangeLabel: string;
  totalKwh: number;
  totalRupiah: number;
  averageKwh: number;
  averageRupiah: number;
  peak: HistoryDay | null;
  lowest: HistoryDay | null;
  dailyTargetKwh: number;
  tariffPerKwh: number;
};

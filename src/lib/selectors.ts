import { STALE_THRESHOLD_MS } from "@/lib/config";
import {
  addDays,
  formatMonthYear,
  fromDateKey,
  isSameDay,
  monthName,
  startOfDay,
  startOfMonth,
  toDateKey,
} from "@/lib/date";
import { classifyRatio, statusLabelFromTone } from "@/lib/energy";
import type {
  AppData,
  DashboardView,
  DailySummary,
  HistoryDay,
  HistoryView,
  RoomMetric,
  StatusTone,
} from "@/lib/types";

export type HistoryRange = "7d" | "this-month" | "last-month";

export const HISTORY_RANGE_OPTIONS: { value: HistoryRange; label: string }[] = [
  { value: "7d", label: "7 Hari Terakhir" },
  { value: "this-month", label: "Bulan Ini" },
  { value: "last-month", label: "Bulan Lalu" },
];

function sumRows(rows: DailySummary[]): { kwh: number; rupiah: number } {
  return rows.reduce(
    (acc, row) => ({
      kwh: acc.kwh + row.totalKwh,
      rupiah: acc.rupiah + row.totalRupiah,
    }),
    { kwh: 0, rupiah: 0 },
  );
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function selectMonthTotals(data: AppData, now = new Date()) {
  const startKey = toDateKey(startOfMonth(now));
  const endKey = toDateKey(startOfDay(now));
  const rows = data.summaries.filter(
    (row) => row.roomId === null && row.date >= startKey && row.date <= endKey,
  );
  return sumRows(rows);
}

export function selectRoomMetrics(
  data: AppData,
  overallTone: StatusTone,
  monthlyTotalKwh: number,
  now = new Date(),
): RoomMetric[] {
  const startKey = toDateKey(startOfMonth(now));
  const endKey = toDateKey(startOfDay(now));

  const base = data.rooms
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((room) => {
      const rows = data.summaries.filter(
        (row) =>
          row.roomId === room.id && row.date >= startKey && row.date <= endKey,
      );
      const totals = sumRows(rows);
      const latest = data.latestReadings[room.id];
      return {
        room,
        monthlyKwh: totals.kwh,
        monthlyCost: totals.rupiah,
        currentWatt: latest?.powerWatt ?? 0,
        latest,
        shareOfTotal: monthlyTotalKwh > 0 ? (totals.kwh / monthlyTotalKwh) * 100 : 0,
      };
    });

  const topKwh = base.reduce((max, item) => Math.max(max, item.monthlyKwh), 0);

  return base.map((item) => {
    const isTopConsumer = topKwh > 0 && item.monthlyKwh === topKwh;
    let tone: StatusTone = "safe";
    if (isTopConsumer && overallTone === "danger") tone = "danger";
    else if (isTopConsumer && overallTone === "warn") tone = "warn";

    return { ...item, isTopConsumer, tone };
  });
}

export function selectDashboard(data: AppData, now = new Date()): DashboardView {
  const { settings, rooms } = data;
  const month = selectMonthTotals(data, now);
  const budgetLimit = settings.budgetLimit;
  const budgetRatio = budgetLimit > 0 ? (month.rupiah / budgetLimit) * 100 : 0;
  const tone = classifyRatio(budgetRatio, settings.warnThreshold, settings.dangerThreshold);

  const roomMetrics = selectRoomMetrics(data, tone, month.kwh, now);

  const latestReadings = roomMetrics
    .map((metric) => metric.latest)
    .filter((reading): reading is NonNullable<typeof reading> => Boolean(reading));

  const totalWatt = latestReadings.reduce((acc, reading) => acc + (reading.powerWatt ?? 0), 0);
  const totalCurrent = latestReadings.reduce((acc, reading) => acc + (reading.current ?? 0), 0);
  const voltageValues = latestReadings
    .map((reading) => reading.voltage)
    .filter((value): value is number => typeof value === "number");
  const frequencyValues = latestReadings
    .map((reading) => reading.frequency)
    .filter((value): value is number => typeof value === "number");

  const voltage =
    voltageValues.length > 0
      ? voltageValues.reduce((acc, value) => acc + value, 0) / voltageValues.length
      : null;
  const frequency =
    frequencyValues.length > 0
      ? frequencyValues.reduce((acc, value) => acc + value, 0) / frequencyValues.length
      : null;

  const lastReadingAt =
    latestReadings.length > 0
      ? latestReadings.reduce((latest, reading) => (reading.ts > latest ? reading.ts : latest), latestReadings[0].ts)
      : null;

  const lastReadingMs = lastReadingAt ? new Date(lastReadingAt).getTime() : 0;
  const isStale = !lastReadingAt || now.getTime() - lastReadingMs > STALE_THRESHOLD_MS;
  const deviceOnline = data.devices.some((device) => device.isOnline) && !isStale;

  return {
    profile: data.profile,
    kosName: data.kos.name,
    settings,
    rooms: roomMetrics,
    monthlyKwh: month.kwh,
    monthlyCost: month.rupiah,
    budgetLimit,
    budgetRatio,
    tone,
    statusLabel: statusLabelFromTone(tone),
    totalWatt,
    totalCurrent,
    voltage,
    frequency,
    lastReadingAt,
    deviceOnline,
    isStale,
    roomCount: rooms.length,
    notifications: data.notifications,
  };
}

function summaryMap(data: AppData): Map<string, DailySummary> {
  const map = new Map<string, DailySummary>();
  for (const row of data.summaries) {
    if (row.roomId === null) map.set(row.date, row);
  }
  return map;
}

export function selectHistory(
  data: AppData,
  range: HistoryRange,
  now = new Date(),
): HistoryView {
  const today = startOfDay(now);
  let start = today;
  let end = today;
  let rangeLabel = "7 Hari Terakhir";

  if (range === "7d") {
    start = addDays(today, -6);
    end = today;
    rangeLabel = "7 Hari Terakhir";
  } else if (range === "this-month") {
    start = startOfMonth(today);
    end = today;
    rangeLabel = formatMonthYear(today);
  } else {
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    start = startOfMonth(prevMonthDate);
    end = new Date(today.getFullYear(), today.getMonth(), 0);
    rangeLabel = `${monthName(prevMonthDate)} ${prevMonthDate.getFullYear()}`;
  }

  const map = summaryMap(data);
  const days: HistoryDay[] = [];
  let cursor = startOfDay(start);

  while (cursor.getTime() <= end.getTime()) {
    const key = toDateKey(cursor);
    const summary = map.get(key);
    days.push({
      date: key,
      kwh: summary?.totalKwh ?? 0,
      rupiah: summary?.totalRupiah ?? 0,
      isToday: isSameDay(cursor, today),
      isMissing: !summary,
    });
    cursor = addDays(cursor, 1);
  }

  const withData = days.filter((day) => !day.isMissing);
  const totals = withData.reduce(
    (acc, day) => ({ kwh: acc.kwh + day.kwh, rupiah: acc.rupiah + day.rupiah }),
    { kwh: 0, rupiah: 0 },
  );

  const divisor = withData.length || days.length || 1;

  const peak = withData.reduce<HistoryDay | null>(
    (best, day) => (!best || day.kwh > best.kwh ? day : best),
    null,
  );
  const lowest = withData.reduce<HistoryDay | null>(
    (best, day) => (!best || day.kwh < best.kwh ? day : best),
    null,
  );

  const dailyTargetKwh =
    data.settings.tariffPerKwh > 0
      ? data.settings.budgetLimit / data.settings.tariffPerKwh / daysInMonth(today)
      : 0;

  return {
    days,
    rangeLabel,
    totalKwh: totals.kwh,
    totalRupiah: totals.rupiah,
    averageKwh: totals.kwh / divisor,
    averageRupiah: totals.rupiah / divisor,
    peak,
    lowest,
    dailyTargetKwh,
    tariffPerKwh: data.settings.tariffPerKwh,
  };
}

export function historyDayToDate(day: HistoryDay): Date {
  return fromDateKey(day.date);
}

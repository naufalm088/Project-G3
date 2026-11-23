const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const dayShortNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dayName(date: Date): string {
  return dayNames[date.getDay()];
}

export function dayShortName(date: Date): string {
  return dayShortNames[date.getDay()];
}

export function monthName(date: Date): string {
  return monthNames[date.getMonth()];
}

export function formatDateLong(date: Date): string {
  return `${dayName(date)}, ${date.getDate()} ${monthName(date)} ${date.getFullYear()}`;
}

export function formatDateShort(date: Date): string {
  return `${date.getDate()} ${monthName(date).slice(0, 3)}`;
}

export function formatMonthYear(date: Date): string {
  return `${monthName(date)} ${date.getFullYear()}`;
}

export function formatTime(date: Date): string {
  return `${`${date.getHours()}`.padStart(2, "0")}.${`${date.getMinutes()}`.padStart(2, "0")}`;
}

export function formatDateTime(date: Date): string {
  return `${formatDateShort(date)} ${formatTime(date)}`;
}

export function minutesSince(iso: string | null, now = new Date()): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.round((now.getTime() - then) / 60000));
}

export function formatRelativeMinutes(minutes: number | null): string {
  if (minutes == null) return "belum ada data";
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

// Formatting helpers (Indonesian locale / IDR currency).

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

/** Format a number as IDR, e.g. Rp750.000 */
export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "Rp0";
  return currencyFormatter.format(Math.round(value));
}

/** Format a plain number with thousands separator. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return numberFormatter.format(value);
}

/** Parse a user-typed currency string ("1.500.000" or "1500000") into a number. */
export function parseAmount(input: string): number {
  if (!input) return 0;
  const cleaned = input.replace(/[^0-9,-]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const MONTHS_ID_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/** "10 Oktober 2026" */
export function formatDateLong(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "-";
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

/** "10 Okt 2026" */
export function formatDateShort(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "-";
  return `${d.getDate()} ${MONTHS_ID_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Senin, 10 Okt 2026" */
export function formatDateWithDay(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "-";
  return `${DAYS_ID[d.getDay()]}, ${formatDateShort(d)}`;
}

/** "19:00" — returns "" if empty. */
export function formatTime(time: string): string {
  return time || "";
}

/** YYYY-MM-DD (local). */
export function toDateInputValue(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Build a Date from a "YYYY-MM-DD" + optional "HH:mm", in local time. */
export function combineDateAndTime(dateStr: string, timeStr?: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return new Date(dateStr);
  let hh = 23, mm = 59;
  if (timeStr) {
    const [th, tm] = timeStr.split(":").map(Number);
    if (Number.isFinite(th)) hh = th;
    if (Number.isFinite(tm)) mm = tm;
  }
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export { MONTHS_ID, MONTHS_ID_SHORT, DAYS_ID };

export function priorityLabel(p: string): string {
  switch (p) {
    case "high":
      return "Tinggi";
    case "medium":
      return "Sedang";
    case "low":
      return "Rendah";
    default:
      return p;
  }
}

export function statusLabel(s: string): string {
  switch (s) {
    case "not_started":
      return "Belum mulai";
    case "in_progress":
      return "Sedang dikerjakan";
    case "completed":
      return "Selesai";
    default:
      return s;
  }
}

export function typeLabel(t: string): string {
  return t === "income" ? "Pemasukan" : "Pengeluaran";
}

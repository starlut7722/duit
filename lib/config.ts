/**
 * DailyKu application configuration.
 *
 * MAX_ACTIVE_USERS is the ONLY place that limits how many *regular users*
 * (role = "user") can be active at the same time. Admins are NOT counted.
 *
 * To raise the limit from 5 to 10 (or any number), change this single
 * constant. No database schema change is required — the table structure
 * already supports any number of rows.
 */
export const MAX_ACTIVE_USERS = 5;

/** Default transaction categories (Indonesian). */
export const DEFAULT_CATEGORIES = [
  "Makanan",
  "Transportasi",
  "Pendidikan",
  "Hiburan",
  "Kebutuhan",
  "Tabungan",
  "Lainnya",
] as const;

/** Reminder presets (minutes before deadline). */
export const REMINDER_OPTIONS: { label: string; value: number }[] = [
  { label: "1 hari sebelum", value: 60 * 24 },
  { label: "1 jam sebelum", value: 60 },
  { label: "30 menit sebelum", value: 30 },
  { label: "15 menit sebelum", value: 15 },
];

export const PRIORITIES = ["low", "medium", "high"] as const;
export const TASK_STATUSES = ["not_started", "in_progress", "completed"] as const;
export const TRANSACTION_TYPES = ["income", "expense"] as const;
export const ROLES = ["admin", "user"] as const;

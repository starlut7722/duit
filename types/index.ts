// Shared application types for DailyKu.

export type Role = "admin" | "user";
export type Priority = "low" | "medium" | "high";
export type TaskStatus = "not_started" | "in_progress" | "completed";
export type TransactionType = "income" | "expense";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
}

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  // Auth-linkage info (never the password hash itself).
  hasPassword: boolean;
  googleConnected: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  subject: string;
  deadlineDate: string; // ISO
  deadlineTime: string; // "HH:mm" | ""
  reminderMinutes: number | null;
  priority: Priority;
  status: TaskStatus;
  notes: string;
  notifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  transactionDate: string; // ISO
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null; // ISO
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  maxActiveUsers: number;
  admins: number;
}

/** View keys for client-side navigation. */
export type UserView =
  | "dashboard"
  | "tasks"
  | "calendar"
  | "finance"
  | "savings"
  | "calculator"
  | "profile";

export type AdminView = "dashboard" | "users" | "profile";

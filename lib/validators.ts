import { z } from "zod";
import {
  PRIORITIES,
  TASK_STATUSES,
  TRANSACTION_TYPES,
  ROLES,
  DEFAULT_CATEGORIES,
} from "./config";

const idSchema = z.string().min(1);

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password harus diisi"),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Judul tugas tidak boleh kosong"),
  subject: z.string().default(""),
  deadlineDate: z.string().min(1, "Tanggal deadline harus diisi"),
  deadlineTime: z.string().default(""),
  reminderMinutes: z.number().int().positive().nullable().optional(),
  priority: z.enum(PRIORITIES).default("medium"),
  status: z.enum(TASK_STATUSES).default("not_started"),
  notes: z.string().default(""),
});

export const transactionSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  amount: z
    .number({ message: "Nominal harus berupa angka" })
    .positive("Nominal harus lebih besar dari 0"),
  category: z.string().min(1, "Kategori harus diisi"),
  description: z.string().default(""),
  transactionDate: z.string().min(1, "Tanggal harus diisi"),
});

export const savingsGoalSchema = z.object({
  title: z.string().min(1, "Nama target tidak boleh kosong"),
  targetAmount: z
    .number({ message: "Target nominal harus berupa angka" })
    .positive("Target nominal harus lebih besar dari 0"),
  currentAmount: z
    .number()
    .min(0, "Jumlah terkumpul tidak boleh negatif")
    .default(0),
  deadline: z.string().nullable().optional(),
  notes: z.string().default(""),
});

export const adjustSavingsSchema = z.object({
  amount: z
    .number({ message: "Nominal harus berupa angka" })
    .refine((v) => v !== 0, "Nominal tidak boleh 0"),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, "Nama tidak boleh kosong"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password lama harus diisi"),
    newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "Password baru tidak boleh sama dengan password lama",
    path: ["newPassword"],
  });

export const createUserSchema = z.object({
  fullName: z.string().min(1, "Nama tidak boleh kosong"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  // role can only be set by admin and only to "user" here (never escalate to admin)
  role: z.enum(ROLES).optional(),
  resetPassword: z.string().min(6).optional(),
});

export { DEFAULT_CATEGORIES };

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-fetch";
import type { Profile, AdminStats } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const meKey = ["me"] as const;

export function useMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: () => api.get<Profile>("/api/me"),
    retry: false,
  });
}

export const adminStatsKey = ["admin", "stats"] as const;
export function useAdminStats() {
  return useQuery({
    queryKey: adminStatsKey,
    queryFn: () => api.get<AdminStats>("/api/admin/stats"),
  });
}

export const adminUsersKey = ["admin", "users"] as const;

type AdminUser = Profile;

export function useAdminUsers() {
  return useQuery({
    queryKey: adminUsersKey,
    queryFn: () => api.get<AdminUser[]>("/api/admin/users"),
  });
}

type CreateUserInput = {
  fullName: string;
  email: string;
  password: string;
  isActive: boolean;
};

export function useCreateUser() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      api.post<AdminUser>("/api/admin/users", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminUsersKey });
      qc.invalidateQueries({ queryKey: adminStatsKey });
      toast({ title: "User berhasil dibuat" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { isActive?: boolean; fullName?: string; resetPassword?: string };
    }) => api.patch<AdminUser>(`/api/admin/users/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminUsersKey });
      qc.invalidateQueries({ queryKey: adminStatsKey });
      toast({ title: "User diperbarui" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminUsersKey });
      qc.invalidateQueries({ queryKey: adminStatsKey });
      toast({ title: "User dihapus" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });
}

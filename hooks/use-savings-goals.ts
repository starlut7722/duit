"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-fetch";
import type { SavingsGoal } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const goalsKey = ["savings-goals"] as const;

export function useSavingsGoals() {
  return useQuery({
    queryKey: goalsKey,
    queryFn: () => api.get<SavingsGoal[]>("/api/savings-goals"),
  });
}

type GoalInput = {
  title: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: string | null;
  notes?: string;
};

export function useCreateGoal() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: GoalInput) => api.post<SavingsGoal>("/api/savings-goals", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goalsKey });
      toast({ title: "Target tabungan dibuat" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<GoalInput> }) =>
      api.patch<SavingsGoal>(`/api/savings-goals/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goalsKey });
      toast({ title: "Target diperbarui" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });
}

export function useAdjustGoal() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      api.patch<SavingsGoal>(`/api/savings-goals/${id}`, { type: "adjust", amount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goalsKey });
      toast({ title: "Dana target diperbarui" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/savings-goals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goalsKey });
      toast({ title: "Target dihapus" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-fetch";
import type { Transaction } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const txnsKey = ["transactions"] as const;

export function useTransactions() {
  return useQuery({
    queryKey: txnsKey,
    queryFn: () => api.get<Transaction[]>("/api/transactions"),
  });
}

type TxnInput = {
  type: "income" | "expense";
  amount: number;
  category: string;
  description?: string;
  transactionDate: string;
};

export function useCreateTransaction() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: TxnInput) => api.post<Transaction>("/api/transactions", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: txnsKey });
      toast({ title: "Transaksi berhasil ditambahkan" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TxnInput> }) =>
      api.patch<Transaction>(`/api/transactions/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: txnsKey });
      toast({ title: "Transaksi diperbarui" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/transactions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: txnsKey });
      toast({ title: "Transaksi dihapus" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });
}

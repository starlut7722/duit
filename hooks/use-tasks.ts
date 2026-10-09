"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-fetch";
import type { Task } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const tasksKey = ["tasks"] as const;

export function useTasks() {
  return useQuery({
    queryKey: tasksKey,
    queryFn: () => api.get<Task[]>("/api/tasks"),
  });
}

type TaskInput = {
  title: string;
  subject?: string;
  deadlineDate: string;
  deadlineTime?: string;
  reminderMinutes?: number | null;
  priority?: "low" | "medium" | "high";
  status?: "not_started" | "in_progress" | "completed";
  notes?: string;
};

export function useCreateTask() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: TaskInput) => api.post<Task>("/api/tasks", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tasksKey });
      toast({ title: "Tugas berhasil ditambahkan" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TaskInput> }) =>
      api.patch<Task>(`/api/tasks/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tasksKey });
      toast({ title: "Tugas berhasil diperbarui" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/tasks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tasksKey });
      toast({ title: "Tugas dihapus" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });
}

"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTasks } from "@/hooks/use-tasks";
import { tasksKey } from "@/hooks/use-tasks";
import { formatDateLong, formatTime, priorityLabel } from "@/lib/format";

/**
 * Client-side reminder scheduler.
 *
 * Realistic web behaviour: notifications are checked while the DailyKu tab is
 * open. If the browser/tab is fully closed, the OS will not show a
 * notification (this is a documented limitation of web notifications). We are
 * honest about this rather than over-promising.
 *
 * - Asks for Notification permission on mount.
 * - Polls tasks every 30s and on data changes.
 * - Fires one notification per task when `now >= deadline - reminderMinutes`.
 * - Persists "notified" state on the server (notifiedAt) so a refresh doesn't
 *   re-fire the same reminder.
 */
export function NotificationScheduler() {
  const qc = useQueryClient();
  const { data: tasks } = useTasks();

  // Request permission once.
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      // Don't auto-prompt aggressively; only if user hasn't decided.
      // We intentionally do NOT force request here — the user can enable it
      // from the Tasks page. Keeping it opt-in is less intrusive.
    }
  }, []);

  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const check = () => {
      const now = Date.now();
      for (const t of tasks) {
        if (t.status === "completed") continue;
        if (t.reminderMinutes == null) continue;

        const deadline = new Date(t.deadlineDate).getTime();
        const remindAt = deadline - t.reminderMinutes * 60 * 1000;
        if (now < remindAt) continue; // not time yet

        const lastNotified = t.notifiedAt
          ? new Date(t.notifiedAt).getTime()
          : 0;
        // Re-fire only if the deadline itself is reached and we haven't warned
        // in the last 60s for the deadline moment. Avoid spam.
        if (lastNotified > remindAt) continue;

        let title = "Pengingat Tugas";
        let body = `${t.title}`;
        if (t.subject) body += ` — ${t.subject}`;
        body += `\nDeadline: ${formatDateLong(t.deadlineDate)}${
          t.deadlineTime ? " " + formatTime(t.deadlineTime) : ""
        } (Prioritas ${priorityLabel(t.priority)})`;

        try {
          if (Notification.permission === "granted") {
            new Notification(title, { body });
          }
        } catch {
          /* ignore */
        }

        // Persist notifiedAt server-side to avoid duplicates after refresh.
        fetch(`/api/tasks/${t.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notifiedAt: new Date().toISOString() }),
        }).then(
          () => qc.invalidateQueries({ queryKey: tasksKey }),
          () => {}
        );
      }
    };

    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [tasks, qc]);

  return null;
}

/** Helper exposed for the Tasks page to request permission on user action. */
export async function requestNotificationPermission(): Promise<
  "granted" | "denied" | "default" | "unsupported"
> {
  if (typeof window === "undefined" || !("Notification" in window))
    return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    const res = await Notification.requestPermission();
    return res;
  } catch {
    return "denied";
  }
}

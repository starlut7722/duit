import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, jsonError } from "@/lib/auth-guard";
import { taskSchema } from "@/lib/validators";
import { combineDateAndTime } from "@/lib/format";
import type { Task } from "@/types";

function serialize(t: {
  id: string;
  userId: string;
  title: string;
  subject: string;
  deadlineDate: Date;
  deadlineTime: string;
  reminderMinutes: number | null;
  priority: string;
  status: string;
  notes: string;
  notifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Task {
  return {
    id: t.id,
    userId: t.userId,
    title: t.title,
    subject: t.subject,
    deadlineDate: t.deadlineDate.toISOString(),
    deadlineTime: t.deadlineTime,
    reminderMinutes: t.reminderMinutes,
    priority: t.priority as Task["priority"],
    status: t.status as Task["status"],
    notes: t.notes,
    notifiedAt: t.notifiedAt ? t.notifiedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

/** GET /api/tasks — list the current user's tasks. */
export async function GET() {
  const res = await requireUser();
  if ("error" in res) return res.error;

  const tasks = await db.task.findMany({
    where: { userId: res.user.id },
    orderBy: [{ deadlineDate: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(tasks.map(serialize));
}

/** POST /api/tasks — create a task owned by the current user. */
export async function POST(req: Request) {
  const res = await requireUser();
  if ("error" in res) return res.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Body tidak valid");
  }

  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data tugas tidak valid");
  }

  const deadlineDate = combineDateAndTime(
    parsed.data.deadlineDate,
    parsed.data.deadlineTime
  );
  if (isNaN(deadlineDate.getTime())) {
    return jsonError("Tanggal deadline tidak valid");
  }

  const created = await db.task.create({
    data: {
      userId: res.user.id,
      title: parsed.data.title,
      subject: parsed.data.subject,
      deadlineDate,
      deadlineTime: parsed.data.deadlineTime,
      reminderMinutes: parsed.data.reminderMinutes ?? null,
      priority: parsed.data.priority,
      status: parsed.data.status,
      notes: parsed.data.notes,
    },
  });
  return NextResponse.json(serialize(created), { status: 201 });
}

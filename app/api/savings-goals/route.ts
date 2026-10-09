import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, jsonError } from "@/lib/auth-guard";
import { savingsGoalSchema } from "@/lib/validators";
import { combineDateAndTime } from "@/lib/format";
import type { SavingsGoal } from "@/types";

function serialize(g: {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}): SavingsGoal {
  return {
    id: g.id,
    userId: g.userId,
    title: g.title,
    targetAmount: g.targetAmount,
    currentAmount: g.currentAmount,
    deadline: g.deadline ? g.deadline.toISOString() : null,
    notes: g.notes,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  };
}

export async function GET() {
  const res = await requireUser();
  if ("error" in res) return res.error;

  const goals = await db.savingsGoal.findMany({
    where: { userId: res.user.id },
    orderBy: [{ createdAt: "asc" }],
  });
  return NextResponse.json(goals.map(serialize));
}

export async function POST(req: Request) {
  const res = await requireUser();
  if ("error" in res) return res.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Body tidak valid");
  }

  const parsed = savingsGoalSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data target tidak valid");
  }

  let deadline: Date | null = null;
  if (parsed.data.deadline) {
    deadline = combineDateAndTime(parsed.data.deadline, "23:59");
    if (isNaN(deadline.getTime())) return jsonError("Deadline tidak valid");
  }

  const created = await db.savingsGoal.create({
    data: {
      userId: res.user.id,
      title: parsed.data.title,
      targetAmount: parsed.data.targetAmount,
      currentAmount: Math.max(0, parsed.data.currentAmount),
      deadline,
      notes: parsed.data.notes,
    },
  });
  return NextResponse.json(serialize(created), { status: 201 });
}

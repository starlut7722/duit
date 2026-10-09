import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, jsonError } from "@/lib/auth-guard";
import { transactionSchema } from "@/lib/validators";
import { combineDateAndTime } from "@/lib/format";
import type { Transaction } from "@/types";

function serialize(t: {
  id: string;
  userId: string;
  type: string;
  amount: number;
  category: string;
  description: string;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}): Transaction {
  return {
    id: t.id,
    userId: t.userId,
    type: t.type as Transaction["type"],
    amount: t.amount,
    category: t.category,
    description: t.description,
    transactionDate: t.transactionDate.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

/** GET /api/transactions — list current user's transactions (newest first). */
export async function GET() {
  const res = await requireUser();
  if ("error" in res) return res.error;

  const txns = await db.transaction.findMany({
    where: { userId: res.user.id },
    orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(txns.map(serialize));
}

/** POST /api/transactions — create a transaction owned by current user. */
export async function POST(req: Request) {
  const res = await requireUser();
  if ("error" in res) return res.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Body tidak valid");
  }

  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Data transaksi tidak valid"
    );
  }

  const date = combineDateAndTime(parsed.data.transactionDate, "");
  if (isNaN(date.getTime())) return jsonError("Tanggal tidak valid");

  const created = await db.transaction.create({
    data: {
      userId: res.user.id,
      type: parsed.data.type,
      amount: parsed.data.amount,
      category: parsed.data.category,
      description: parsed.data.description,
      transactionDate: date,
    },
  });
  return NextResponse.json(serialize(created), { status: 201 });
}

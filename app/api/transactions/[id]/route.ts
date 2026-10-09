import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, jsonError } from "@/lib/auth-guard";
import { transactionSchema } from "@/lib/validators";
import { combineDateAndTime } from "@/lib/format";

type Params = { params: { id: string } };

async function getOwnedTxn(id: string, userId: string) {
  const txn = await db.transaction.findUnique({ where: { id } });
  if (!txn) return null;
  if (txn.userId !== userId) return "forbidden" as const;
  return txn;
}

export async function PATCH(req: Request, { params }: Params) {
  const res = await requireUser();
  if ("error" in res) return res.error;

  const owned = await getOwnedTxn(params.id, res.user.id);
  if (owned === null) return jsonError("Transaksi tidak ditemukan", 404);
  if (owned === "forbidden") return jsonError("Akses ditolak", 403);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Body tidak valid");
  }

  const parsed = transactionSchema.partial().safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Data transaksi tidak valid"
    );
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.type !== undefined) data.type = parsed.data.type;
  if (parsed.data.amount !== undefined) data.amount = parsed.data.amount;
  if (parsed.data.category !== undefined) data.category = parsed.data.category;
  if (parsed.data.description !== undefined)
    data.description = parsed.data.description;
  if (parsed.data.transactionDate !== undefined) {
    const d = combineDateAndTime(parsed.data.transactionDate, "");
    if (isNaN(d.getTime())) return jsonError("Tanggal tidak valid");
    data.transactionDate = d;
  }

  const updated = await db.transaction.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const res = await requireUser();
  if ("error" in res) return res.error;

  const owned = await getOwnedTxn(params.id, res.user.id);
  if (owned === null) return jsonError("Transaksi tidak ditemukan", 404);
  if (owned === "forbidden") return jsonError("Akses ditolak", 403);

  await db.transaction.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

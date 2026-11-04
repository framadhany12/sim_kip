import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { emailVerifications, users } from "@/db/schema";
import { createSession, sha256 } from "@/lib/auth";

/** Tautan dari email verifikasi: aktifkan akun, langsung masuk, lalu ke dashboard. */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = await getDb();
  const [v] = await db
    .select()
    .from(emailVerifications)
    .where(and(eq(emailVerifications.id, sha256(token)), gt(emailVerifications.expiresAt, new Date())));
  if (!v) return NextResponse.redirect(new URL("/verifikasi-email?status=tidak-berlaku", req.url));

  // Hanya akun pendaftar: sesi admin hanya boleh lahir dari login 2 langkah (authenticator).
  const [akun] = await db.select({ role: users.role }).from(users).where(eq(users.id, v.userId));
  if (akun?.role !== "pendaftar") return NextResponse.redirect(new URL("/verifikasi-email?status=tidak-berlaku", req.url));

  await db.transaction(async (tx) => {
    await tx.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, v.userId));
    await tx.delete(emailVerifications).where(eq(emailVerifications.userId, v.userId));
  });
  await createSession(v.userId);
  const res = NextResponse.redirect(new URL("/dashboard?terverifikasi=1", req.url));
  res.cookies.delete("kip_verif_email");
  res.cookies.delete("kip_dev_link");
  return res;
}

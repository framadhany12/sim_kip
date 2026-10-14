import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";

const COOKIE = "kip_session";
const SESSION_DAYS = 7;

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");

export type CurrentUser = { id: string; nama: string; email: string; role: "pendaftar" | "admin" };

export async function createSession(userId: string) {
  const db = await getDb();
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  // Hanya hash token yang disimpan, jadi kebocoran database tidak membocorkan sesi aktif.
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  }
  jar.delete(COOKIE);
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const [row] = await db
    .select({ id: users.id, nama: users.nama, email: users.email, role: users.role, verified: users.emailVerifiedAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  // Pendaftar yang emailnya belum diverifikasi tidak dianggap login.
  if (!row || (row.role === "pendaftar" && !row.verified)) return null;
  return { id: row.id, nama: row.nama, email: row.email, role: row.role };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  return user;
}

export async function requirePendaftar() {
  const user = await requireUser();
  if (user.role !== "pendaftar") redirect("/admin");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { kodePemulihan } from "@/db/schema";
import { kunciMfa } from "./totp";

/**
 * Tiket login 2 langkah: setelah kata sandi admin benar, tiket bertanda tangan (HMAC) disimpan di cookie
 * sampai kode authenticator diverifikasi. Tanpa tiket valid tidak ada sesi yang dibuat.
 */
const COOKIE_TIKET = "kip_mfa";
const TIKET_MENIT = 15;

const tandatangani = (isi: string) => createHmac("sha256", kunciMfa()).update(isi).digest("base64url");

export async function setTiketMfa(userId: string) {
  const isi = `${userId}.${Date.now() + TIKET_MENIT * 60e3}`;
  (await cookies()).set(COOKIE_TIKET, `${isi}.${tandatangani(isi)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TIKET_MENIT * 60,
  });
}

/** Id pengguna pemilik tiket yang masih berlaku, atau null. */
export async function bacaTiketMfa(): Promise<string | null> {
  const nilai = (await cookies()).get(COOKIE_TIKET)?.value;
  const bagian = nilai?.split(".");
  if (!bagian || bagian.length !== 3) return null;
  const [userId, exp, ttd] = bagian;
  const benar = Buffer.from(tandatangani(`${userId}.${exp}`));
  const kirim = Buffer.from(ttd);
  if (benar.length !== kirim.length || !timingSafeEqual(benar, kirim)) return null;
  return Number(exp) > Date.now() ? userId : null;
}

export async function hapusTiketMfa() {
  (await cookies()).delete(COOKIE_TIKET);
}

const HURUF_KODE = "abcdefghjkmnpqrstuvwxyz23456789";
const hashKode = (k: string) => createHash("sha256").update(k.toLowerCase().replace(/[^a-z0-9]/g, "")).digest("hex");

/** Membuat 8 kode pemulihan baru (menggantikan yang lama); kode asli hanya dikembalikan sekali ini. */
export async function buatKodePemulihan(userId: string) {
  const kode = Array.from({ length: 8 }, () => {
    const b = randomBytes(10);
    const s = Array.from(b, (x) => HURUF_KODE[x % HURUF_KODE.length]).join("");
    return `${s.slice(0, 5)}-${s.slice(5)}`;
  });
  const db = await getDb();
  await db.delete(kodePemulihan).where(eq(kodePemulihan.userId, userId));
  await db.insert(kodePemulihan).values(kode.map((k) => ({ userId, hash: hashKode(k) })));
  return kode;
}

/** Memakai satu kode pemulihan (sekali pakai). True bila kode benar milik pengguna ini. */
export async function pakaiKodePemulihan(userId: string, kode: string) {
  const db = await getDb();
  const [r] = await db.delete(kodePemulihan).where(and(eq(kodePemulihan.userId, userId), eq(kodePemulihan.hash, hashKode(kode))));
  return (r as unknown as { affectedRows: number }).affectedRows > 0;
}

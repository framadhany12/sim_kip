"use server";

import { redirect } from "next/navigation";
import { and, eq, isNull, lt, or } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { bolehCoba } from "@/lib/anti-bot";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { bacaTiketMfa, buatKodePemulihan, hapusTiketMfa, pakaiKodePemulihan } from "@/lib/mfa";
import { dekripsiRahasia, periksaKodeTotp } from "@/lib/totp";

/** Admin aktif yang memegang tiket login 2 langkah; null bila tiket habis/tidak sah. */
async function adminDariTiket() {
  const userId = await bacaTiketMfa();
  if (!userId) return null;
  const db = await getDb();
  const [u] = await db.select().from(users).where(and(eq(users.id, userId), eq(users.role, "admin"), eq(users.aktif, true)));
  return u ?? null;
}

/** Menandai langkah waktu `langkah` sebagai terpakai; false bila sudah dipakai (kode yang sama tidak boleh dua kali). */
async function catatLangkah(userId: string, langkah: number) {
  const db = await getDb();
  const [r] = await db
    .update(users)
    .set({ totpLangkah: langkah })
    .where(and(eq(users.id, userId), or(isNull(users.totpLangkah), lt(users.totpLangkah, langkah))));
  return (r as unknown as { affectedRows: number }).affectedRows > 0;
}

/** Langkah 2 login: kode 6 digit dari aplikasi authenticator, atau satu kode pemulihan. */
export async function masukDenganKode(_: FormState, fd: FormData): Promise<FormState> {
  const u = await adminDariTiket();
  if (!u) redirect("/masuk");
  if (!u.totpAktif || !u.totpSecret) redirect("/masuk/verifikasi");
  if (!bolehCoba(`mfa:${u.id}`, 5, 10 * 60e3)) return { message: "Terlalu banyak percobaan. Tunggu 10 menit lalu masuk ulang." };
  const kode = String(fd.get("kode") ?? "").replace(/[\s-]/g, "");
  if (!kode) return { errors: { kode: "Masukkan kode dari aplikasi authenticator." } };

  let benar = false;
  if (/^\d{6}$/.test(kode)) {
    const langkah = periksaKodeTotp(dekripsiRahasia(u.totpSecret), kode, u.totpLangkah);
    benar = langkah != null && (await catatLangkah(u.id, langkah));
  } else {
    benar = await pakaiKodePemulihan(u.id, kode);
  }
  if (!benar) return { errors: { kode: "Kode salah atau sudah kedaluwarsa. Coba kode terbaru, atau pakai kode pemulihan." } };

  await hapusTiketMfa();
  await createSession(u.id);
  redirect("/admin");
}

/** Aktivasi pertama: memastikan aplikasi authenticator sudah menghasilkan kode yang benar, lalu mengeluarkan kode pemulihan. */
export async function aktifkanAuthenticator(_: FormState, fd: FormData): Promise<FormState> {
  const u = await adminDariTiket();
  if (!u) redirect("/masuk");
  if (u.totpAktif || !u.totpSecret) redirect("/masuk/verifikasi");
  if (!bolehCoba(`mfa:${u.id}`, 5, 10 * 60e3)) return { message: "Terlalu banyak percobaan. Tunggu 10 menit lalu masuk ulang." };
  const kode = nilaiForm(fd).kode?.replace(/\s/g, "") ?? "";
  const langkah = periksaKodeTotp(dekripsiRahasia(u.totpSecret), kode, null);
  if (langkah == null) return { errors: { kode: "Kode salah. Pastikan jam ponsel akurat, lalu masukkan kode terbaru." } };

  const db = await getDb();
  await db.update(users).set({ totpAktif: true, totpLangkah: langkah }).where(eq(users.id, u.id));
  const pemulihan = await buatKodePemulihan(u.id);
  return { ok: true, values: { pemulihan: pemulihan.join(" ") } };
}

/** Setelah kode pemulihan disimpan: buat sesi dan masuk ke panel admin. */
export async function selesaiAktivasi() {
  const u = await adminDariTiket();
  if (!u || !u.totpAktif) redirect("/masuk");
  await hapusTiketMfa();
  await createSession(u.id);
  redirect("/admin");
}

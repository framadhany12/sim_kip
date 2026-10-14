"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { emailVerifications, passwordResets, pendaftaran, riwayatStatus, sessions, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { MAX_UMUR } from "@/lib/constants";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { cariPendaftaranUser, GELOMBANG_AKTIF, isDuplikat } from "@/lib/pendaftaran";
import { EMAIL_RE } from "@/lib/anti-bot";
import { hashPassword } from "@/lib/password";
import { kirimEmailSandiDiubah, urlAplikasi } from "@/lib/mail";
import {
  simpanDataDiriCore,
  simpanEkonomiCore,
  simpanKeluargaCore,
  simpanRekomendasiCore,
  simpanSekolahCore,
  type HasilSimpan,
} from "@/lib/simpan-pendaftaran";

/** Bagian formulir yang bisa diedit admin lewat Master Mahasiswa. */
export type BagianEdit = "diri" | "keluarga" | "ekonomi" | "sekolah" | "rekomendasi";
const LABEL_BAGIAN: Record<BagianEdit, string> = {
  diri: "Data Diri",
  keluarga: "Data Keluarga",
  ekonomi: "Data Ekonomi Orang Tua",
  sekolah: "Data Sekolah & Pilihan Jurusan",
  rekomendasi: "Data Rekomendasi",
};

/** Pendaftaran terbaru user; bila belum ada, dibuatkan draf yang riwayatnya mencatat bahwa adminlah yang membuatnya. */
async function pendaftaranUntukAdmin(userId: string, adminId: string) {
  const ada = await cariPendaftaranUser(userId);
  if (ada) return ada;
  const db = await getDb();
  const id = crypto.randomUUID();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(pendaftaran).values({ id, userId, gelombang: GELOMBANG_AKTIF });
      await tx.insert(riwayatStatus).values({ pendaftaranId: id, status: "draft", catatan: "Pendaftaran dibuat oleh admin", diubahOleh: adminId });
    });
  } catch (e) {
    if (!isDuplikat(e)) throw e; // dua permintaan bersamaan: pakai baris yang sudah dibuat yang lain
  }
  return (await cariPendaftaranUser(userId))!;
}

async function ambilPendaftar(userId: string) {
  const db = await getDb();
  const [u] = await db.select().from(users).where(and(eq(users.id, userId), eq(users.role, "pendaftar")));
  return u ?? null;
}

/** Admin mengubah satu bagian data pendaftar; aturan validasinya sama persis dengan formulir pendaftar. */
export async function simpanBagianPendaftar(bagian: BagianEdit, userId: string, _: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const u = await ambilPendaftar(userId);
  if (!u) return { message: "Akun pendaftar tidak ditemukan." };
  if (!(bagian in LABEL_BAGIAN)) return { message: "Bagian tidak dikenal." };
  // Akun yang belum pernah membuka formulir dibuatkan draf pendaftaran saat admin menyimpan data pertamanya.
  const p = await pendaftaranUntukAdmin(userId, admin.id);
  const v = nilaiForm(fd);

  let hasil: HasilSimpan;
  if (bagian === "diri") hasil = await simpanDataDiriCore(p.id, v);
  else if (bagian === "keluarga") hasil = await simpanKeluargaCore(p.id, v);
  else if (bagian === "ekonomi") hasil = await simpanEkonomiCore(p.id, v);
  else if (bagian === "sekolah") hasil = await simpanSekolahCore(p.id, v, "admin");
  else hasil = await simpanRekomendasiCore(p.id, v);
  if (hasil.galat) return hasil.galat;

  const db = await getDb();
  await db.update(pendaftaran).set({ updatedAt: new Date() }).where(eq(pendaftaran.id, p.id));
  await db.insert(riwayatStatus).values({ pendaftaranId: p.id, status: p.status, catatan: `Admin memperbarui ${LABEL_BAGIAN[bagian]}`, diubahOleh: admin.id });
  revalidatePath("/", "layout");
  const peringatanUmur = (hasil.umur ?? 0) > MAX_UMUR ? ` Perhatian: umur pendaftar ${hasil.umur} tahun, melebihi batas ${MAX_UMUR} tahun.` : "";
  return { ok: true, message: `${LABEL_BAGIAN[bagian]} tersimpan dan tercatat di riwayat pendaftar.${peringatanUmur}` };
}

/** Nama, email login, dan status verifikasi email akun pendaftar. */
export async function simpanAkunPendaftar(userId: string, _: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const u = await ambilPendaftar(userId);
  if (!u) return { message: "Akun pendaftar tidak ditemukan." };
  const v = nilaiForm(fd);
  const email = (v.email ?? "").toLowerCase();
  const e: Record<string, string> = {};
  if ((v.nama ?? "").length < 3) e.nama = "Nama minimal 3 huruf.";
  if (!EMAIL_RE.test(email)) e.email = "Masukkan alamat email yang valid.";
  const db = await getDb();
  if (!e.email) {
    const [bentrok] = await db.select({ id: users.id }).from(users).where(and(eq(users.email, email), ne(users.id, userId)));
    if (bentrok) e.email = "Email sudah dipakai akun lain.";
  }
  if (Object.keys(e).length) return { errors: e, values: v };

  const terverifikasi = fd.get("terverifikasi") === "on";
  await db
    .update(users)
    .set({
      nama: v.nama,
      email,
      // Mencentang menandai terverifikasi sekarang; tanda yang sudah ada dipertahankan (tanggalnya tidak ditimpa).
      emailVerifiedAt: terverifikasi ? (u.emailVerifiedAt ?? new Date()) : null,
    })
    .where(eq(users.id, userId));
  if (terverifikasi) await db.delete(emailVerifications).where(eq(emailVerifications.userId, userId));
  if (email !== u.email || terverifikasi !== !!u.emailVerifiedAt) {
    const p = await cariPendaftaranUser(userId);
    if (p) {
      const apa = [email !== u.email ? "email login" : "", terverifikasi !== !!u.emailVerifiedAt ? (terverifikasi ? "status email (diverifikasi admin)" : "status email (verifikasi dicabut)") : ""].filter(Boolean).join(" dan ");
      await db.insert(riwayatStatus).values({ pendaftaranId: p.id, status: p.status, catatan: `Admin memperbarui data akun: ${apa}`, diubahOleh: admin.id });
    }
    // Perubahan email/verifikasi membatalkan sesi lama agar akun tidak tetap terbuka dengan identitas lama.
    if (email !== u.email || !terverifikasi) await db.delete(sessions).where(eq(sessions.userId, userId));
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Data akun tersimpan." };
}

const ALFABET_SANDI = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; // tanpa huruf/angka yang mirip (I, l, 1, O, 0)

/** Sandi acak 12 karakter yang pasti memuat huruf dan angka. */
function buatSandiAcak() {
  for (;;) {
    const s = Array.from({ length: 12 }, () => ALFABET_SANDI[randomInt(ALFABET_SANDI.length)]).join("");
    if (/[a-zA-Z]/.test(s) && /\d/.test(s)) return s;
  }
}

/**
 * Admin mengatur ulang kata sandi pendaftar. Kata sandi lama tidak bisa dilihat (disimpan sebagai hash satu arah).
 * Sandi baru (acak atau ditentukan admin) dikembalikan sekali untuk disampaikan ke pendaftar; semua sesi login lamanya
 * dikeluarkan, tautan reset yang menggantung dibatalkan, dan pendaftar menerima email pemberitahuan.
 */
export async function aturSandiPendaftar(userId: string, _: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const u = await ambilPendaftar(userId);
  if (!u) return { message: "Akun pendaftar tidak ditemukan." };
  const mode = String(fd.get("mode") ?? "acak");
  let sandi: string;
  if (mode === "manual") {
    sandi = String(fd.get("password") ?? "");
    if (sandi.length < 8) return { errors: { password: "Kata sandi minimal 8 karakter." } };
    if (!/[a-zA-Z]/.test(sandi) || !/\d/.test(sandi)) return { errors: { password: "Kata sandi harus memuat huruf dan angka." } };
    if (sandi.length > 100) return { errors: { password: "Kata sandi maksimal 100 karakter." } };
  } else sandi = buatSandiAcak();

  const db = await getDb();
  const hash = await hashPassword(sandi);
  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash: hash }).where(eq(users.id, userId));
    await tx.delete(sessions).where(eq(sessions.userId, userId));
    await tx.delete(passwordResets).where(eq(passwordResets.userId, userId));
  });
  const p = await cariPendaftaranUser(userId);
  if (p) await db.insert(riwayatStatus).values({ pendaftaranId: p.id, status: p.status, catatan: "Admin mengatur ulang kata sandi akun", diubahOleh: admin.id });
  let emailTerkirim = true;
  try {
    await kirimEmailSandiDiubah(u.email, u.nama, `${await urlAplikasi()}/lupa-sandi`, true);
  } catch (err) {
    emailTerkirim = false;
    console.error("[email] gagal mengirim pemberitahuan reset sandi oleh admin:", err);
  }
  revalidatePath("/", "layout");
  return {
    ok: true,
    // Sandi hanya dikembalikan di sini (sekali) agar ditampilkan ke admin; tidak disimpan dalam bentuk terbaca di mana pun.
    values: { sandi },
    message:
      "Kata sandi diatur ulang dan pendaftar dikeluarkan dari semua perangkat." +
      (u.emailVerifiedAt ? "" : " Perhatian: email akun ini belum terverifikasi, sehingga pendaftar belum bisa masuk sebelum diverifikasi (lihat tab Akun).") +
      (emailTerkirim ? " Email pemberitahuan sudah dikirim ke pendaftar." : " Email pemberitahuan gagal dikirim; sampaikan kata sandi langsung kepada pendaftar."),
  };
}

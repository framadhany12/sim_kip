"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { berkas, faq, jurusan, pendaftaran, pertanyaan, rekomendasi, riwayatStatus, sumberRekomendasi } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { nilaiForm, type FormState } from "@/lib/form-state";

const KEPUTUSAN = ["diperiksa", "perbaikan", "diterima", "ditolak"] as const;
type Keputusan = (typeof KEPUTUSAN)[number];

export async function putuskan(pendaftaranId: string, _: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const keputusan = String(fd.get("keputusan")) as Keputusan;
  const catatan = String(fd.get("catatan") ?? "").trim();
  if (!KEPUTUSAN.includes(keputusan)) return { message: "Keputusan tidak dikenal." };
  if ((keputusan === "perbaikan" || keputusan === "ditolak") && catatan.length < 5)
    return {
      errors: { catatan: keputusan === "ditolak" ? "Tulis alasan penolakan untuk pendaftar." : "Tulis bagian yang perlu diperbaiki pendaftar." },
      values: { catatan },
    };
  const db = await getDb();
  const [p] = await db.select().from(pendaftaran).where(eq(pendaftaran.id, pendaftaranId));
  if (!p) return { message: "Pendaftaran tidak ditemukan." };
  if (p.status === "draft") return { message: "Pendaftaran ini belum dikirim oleh pendaftar." };

  const catatanDefault = { diperiksa: "Pendaftaran mulai diperiksa admin", diterima: "Selamat, pendaftaran Anda diterima.", perbaikan: "", ditolak: "" };
  await db.transaction(async (tx) => {
    await tx
      .update(pendaftaran)
      .set({
        status: keputusan,
        // "Mulai periksa" tidak menghapus catatan sebelumnya kecuali admin menulis catatan baru.
        ...(keputusan !== "diperiksa" || catatan ? { catatanAdmin: catatan || null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(pendaftaran.id, pendaftaranId));
    await tx.insert(riwayatStatus).values({ pendaftaranId, status: keputusan, catatan: catatan || catatanDefault[keputusan], diubahOleh: admin.id });
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Keputusan tersimpan dan sudah terlihat oleh pendaftar." };
}

export async function verifikasiBerkas(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const status = String(fd.get("status"));
  if (!["menunggu", "valid", "tidak_valid"].includes(status)) return;
  const db = await getDb();
  await db
    .update(berkas)
    .set({ statusVerifikasi: status as "menunggu" | "valid" | "tidak_valid" })
    .where(eq(berkas.id, id));
  revalidatePath("/admin/pendaftar");
}

// ---------- Kelola jurusan ----------

export async function simpanJurusan(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const v = nilaiForm(fd);
  const id = v.id || null;
  const e: Record<string, string> = {};
  const kode = v.kode.toUpperCase();
  if (!/^[A-Z0-9-]{1,10}$/.test(kode)) e.kode = "Kode 1–10 huruf/angka.";
  if (v.nama.length < 3) e.nama = "Nama jurusan minimal 3 huruf.";
  const db = await getDb();
  if (!e.kode) {
    const [dup] = await db
      .select({ id: jurusan.id })
      .from(jurusan)
      .where(id ? and(eq(jurusan.kode, kode), ne(jurusan.id, id)) : eq(jurusan.kode, kode));
    if (dup) e.kode = "Kode sudah dipakai jurusan lain.";
  }
  if (Object.keys(e).length) return { errors: e, values: v };
  const data = { kode, nama: v.nama, bukaPilihan1: fd.get("bukaPilihan1") === "on", bukaPilihan2: fd.get("bukaPilihan2") === "on", aktif: fd.get("aktif") === "on" };
  if (id) await db.update(jurusan).set(data).where(eq(jurusan.id, id));
  else await db.insert(jurusan).values(data);
  revalidatePath("/admin/jurusan");
  revalidatePath("/formulir/sekolah");
  return { ok: true, message: id ? "Jurusan diperbarui." : "Jurusan ditambahkan." };
}

export async function toggleJurusan(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const field = String(fd.get("field"));
  if (!["aktif", "bukaPilihan1", "bukaPilihan2"].includes(field)) return;
  const db = await getDb();
  const [j] = await db.select().from(jurusan).where(eq(jurusan.id, id));
  if (!j) return;
  const key = field as "aktif" | "bukaPilihan1" | "bukaPilihan2";
  await db.update(jurusan).set({ [key]: !j[key] }).where(eq(jurusan.id, id));
  revalidatePath("/admin/jurusan");
}

// ---------- Tanya admin & FAQ ----------

export async function jawabPertanyaan(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const jawaban = String(fd.get("jawaban") ?? "").trim();
  if (jawaban.length < 2) return { errors: { jawaban: "Tulis jawaban." } };
  const db = await getDb();
  await db.update(pertanyaan).set({ jawaban, dijawabOleh: admin.id, answeredAt: new Date() }).where(eq(pertanyaan.id, id));
  revalidatePath("/admin/pertanyaan");
  revalidatePath("/bantuan");
  return { ok: true, message: "Jawaban terkirim." };
}

export async function simpanFaq(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const v = nilaiForm(fd);
  const e: Record<string, string> = {};
  if (v.pertanyaan.length < 5) e.pertanyaan = "Tulis pertanyaan.";
  if (v.jawaban.length < 5) e.jawaban = "Tulis jawaban.";
  if (Object.keys(e).length) return { errors: e, values: v };
  const data = { pertanyaan: v.pertanyaan, jawaban: v.jawaban, urutan: Number(v.urutan) || 0 };
  const db = await getDb();
  if (v.id) await db.update(faq).set(data).where(eq(faq.id, v.id));
  else await db.insert(faq).values(data);
  revalidatePath("/admin/faq");
  revalidatePath("/bantuan");
  return { ok: true, message: "FAQ tersimpan." };
}

export async function hapusFaq(fd: FormData) {
  await requireAdmin();
  const db = await getDb();
  await db.delete(faq).where(eq(faq.id, String(fd.get("id"))));
  revalidatePath("/admin/faq");
  revalidatePath("/bantuan");
}

// ---------- Kelola sumber rekomendasi ----------

export async function simpanSumberRekomendasi(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const v = nilaiForm(fd);
  const id = v.id || null;
  const e: Record<string, string> = {};
  if (v.nama.length < 2 || v.nama.length > 60) e.nama = "Nama pilihan 2–60 karakter.";
  const db = await getDb();
  if (!e.nama) {
    const [dup] = await db
      .select({ id: sumberRekomendasi.id })
      .from(sumberRekomendasi)
      .where(id ? and(eq(sumberRekomendasi.nama, v.nama), ne(sumberRekomendasi.id, id)) : eq(sumberRekomendasi.nama, v.nama));
    if (dup) e.nama = "Pilihan dengan nama ini sudah ada.";
  }
  if (Object.keys(e).length) return { errors: e, values: v };
  const data = { nama: v.nama, urutan: Number(v.urutan) || 0, butuhKontak: fd.get("butuhKontak") === "on", aktif: fd.get("aktif") === "on" };
  if (id) await db.update(sumberRekomendasi).set(data).where(eq(sumberRekomendasi.id, id));
  else await db.insert(sumberRekomendasi).values(data);
  revalidatePath("/admin/rekomendasi");
  revalidatePath("/formulir/rekomendasi");
  return { ok: true, message: id ? "Pilihan diperbarui." : "Pilihan ditambahkan." };
}

export async function toggleSumberRekomendasi(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const field = String(fd.get("field"));
  if (field !== "aktif" && field !== "butuhKontak") return;
  const db = await getDb();
  const [s] = await db.select().from(sumberRekomendasi).where(eq(sumberRekomendasi.id, id));
  if (!s) return;
  await db.update(sumberRekomendasi).set({ [field]: !s[field] }).where(eq(sumberRekomendasi.id, id));
  revalidatePath("/admin/rekomendasi");
}

/** Hapus hanya bila belum pernah dipilih pendaftar; selain itu cukup dinonaktifkan. */
export async function hapusSumberRekomendasi(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(rekomendasi).where(eq(rekomendasi.sumberId, id));
  if (n > 0) await db.update(sumberRekomendasi).set({ aktif: false }).where(eq(sumberRekomendasi.id, id));
  else await db.delete(sumberRekomendasi).where(eq(sumberRekomendasi.id, id));
  revalidatePath("/admin/rekomendasi");
}

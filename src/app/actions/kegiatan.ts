"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { kegiatan } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { rahasiaBaru, waktuWib } from "@/lib/kegiatan";

/** Admin (kemahasiswaan) menambahkan kegiatan; kode QR presensinya dibuat otomatis. */
export async function tambahKegiatan(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const v = nilaiForm(fd);
  const e: Record<string, string> = {};
  if (v.nama.length < 3 || v.nama.length > 150) e.nama = "Nama kegiatan 3–150 karakter.";
  if (v.lokasi && v.lokasi.length > 150) e.lokasi = "Lokasi maksimal 150 karakter.";
  if (v.deskripsi && v.deskripsi.length > 2000) e.deskripsi = "Deskripsi maksimal 2000 karakter.";
  const mulai = waktuWib(v.mulai);
  const selesai = waktuWib(v.selesai);
  if (!mulai) e.mulai = "Isi waktu mulai.";
  if (!selesai) e.selesai = "Isi waktu selesai.";
  if (mulai && selesai && selesai <= mulai) e.selesai = "Waktu selesai harus setelah waktu mulai.";
  if (Object.keys(e).length) return { errors: e, values: v };

  const db = await getDb();
  await db.insert(kegiatan).values({
    nama: v.nama,
    deskripsi: v.deskripsi || null,
    lokasi: v.lokasi || null,
    mulai: mulai!,
    selesai: selesai!,
    rahasia: rahasiaBaru(),
    dibuatOleh: admin.id,
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Kegiatan ditambahkan. Buka kegiatannya untuk menampilkan barcode presensi." };
}

/** Menghapus kegiatan beserta seluruh rekap kehadirannya. */
export async function hapusKegiatan(id: string) {
  await requireAdmin();
  const db = await getDb();
  await db.delete(kegiatan).where(eq(kegiatan.id, id));
  revalidatePath("/", "layout");
}

"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { kegiatan } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { rahasiaBaru, waktuWib } from "@/lib/kegiatan";
import { ringkasPerAngkatan } from "@/lib/pelaporan-akademik";

/** Admin (kemahasiswaan) menambahkan kegiatan untuk angkatan terpilih atau semua angkatan; kode QR presensinya dibuat otomatis. */
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
  const dipilih = [...new Set(fd.getAll("angkatan").map((x) => Number(x)))].filter((n) => Number.isInteger(n) && n > 1900 && n < 2200).sort((a, b) => a - b);
  if (dipilih.length === 0) e.angkatan = "Pilih minimal satu angkatan.";
  if (Object.keys(e).length) return { errors: e, values: v };

  // Semua angkatan terpilih = tanpa sasaran, jadi angkatan yang muncul kemudian ikut berhak hadir.
  const semua = (await ringkasPerAngkatan()).every((a) => dipilih.includes(a.angkatan));
  const db = await getDb();
  await db.insert(kegiatan).values({
    nama: v.nama,
    deskripsi: v.deskripsi || null,
    lokasi: v.lokasi || null,
    mulai: mulai!,
    selesai: selesai!,
    rahasia: rahasiaBaru(),
    angkatanSasaran: semua ? null : dipilih.join(","),
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

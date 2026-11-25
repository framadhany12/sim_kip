"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { bukuTabungan, pengumumanMahasiswa } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ANGKATAN_BUKU_TABUNGAN, JENIS_PENGUMUMAN_BT } from "@/lib/buku-tabungan";
import { MAKS_PESAN_HAPUS } from "@/lib/constants";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { hapusBerkas } from "@/lib/storage";

/**
 * Admin menghapus kiriman buku tabungan yang keliru agar mahasiswa bisa mengirim ulang.
 * `pesan` (opsional) menjelaskan kesalahannya; tampil sebagai banner pribadi di akun mahasiswa dan hilang sendiri
 * setelah ia mengirim ulang (lihat `syaratPengumumanBt`).
 */
export async function hapusBukuTabungan(id: string, pesan = "") {
  const admin = await requireAdmin();
  pesan = pesan.trim();
  if (pesan.length > MAKS_PESAN_HAPUS) return { ok: false, message: `Pesan maksimal ${MAKS_PESAN_HAPUS} karakter.` };
  const db = await getDb();
  const [lama] = await db.select().from(bukuTabungan).where(eq(bukuTabungan.id, id));
  if (!lama) return { ok: false, message: "Buku tabungan ini sudah tidak ada. Muat ulang halaman." };
  await db.delete(bukuTabungan).where(eq(bukuTabungan.id, id));
  await hapusBerkas(lama.fileUrl).catch(() => {});
  // Pesan dari penghapusan sebelumnya ditutup agar tidak muncul lagi.
  await db
    .update(pengumumanMahasiswa)
    .set({ aktif: false })
    .where(and(eq(pengumumanMahasiswa.pendaftaranId, lama.pendaftaranId), eq(pengumumanMahasiswa.jenis, JENIS_PENGUMUMAN_BT)));
  if (pesan)
    await db.insert(pengumumanMahasiswa).values({
      judul: "Buku Tabungan dihapus admin",
      isi: pesan,
      jenis: JENIS_PENGUMUMAN_BT,
      pendaftaranId: lama.pendaftaranId,
      dibuatOleh: admin.id,
    });
  revalidatePath("/", "layout");
  return { ok: true, message: "Buku tabungan dihapus." };
}

/** Banner ke mahasiswa angkatan terpilih (2026 ke atas) yang belum mengirim buku tabungan; hilang sendiri setelah masing-masing mengirim. */
export async function buatPengumumanBukuTabungan(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const v = nilaiForm(fd);
  const e: Record<string, string> = {};
  if (v.judul.length < 5 || v.judul.length > 150) e.judul = "Judul 5–150 karakter.";
  if (v.isi.length < 10 || v.isi.length > 2000) e.isi = "Isi pengumuman 10–2000 karakter.";
  if (v.tenggat && !/^\d{4}-\d{2}-\d{2}$/.test(v.tenggat)) e.tenggat = "Tanggal tenggat tidak valid.";
  const angkatan = [...new Set(fd.getAll("angkatan").map((x) => Number(x)))].filter((n) => Number.isInteger(n) && n >= ANGKATAN_BUKU_TABUNGAN && n < 2200).sort((a, b) => a - b);
  if (angkatan.length === 0) e.angkatan = "Pilih minimal satu angkatan.";
  if (Object.keys(e).length) return { errors: e, values: v };

  const db = await getDb();
  await db.insert(pengumumanMahasiswa).values({ judul: v.judul, isi: v.isi, jenis: JENIS_PENGUMUMAN_BT, angkatanSasaran: angkatan.join(","), tenggat: v.tenggat || null, dibuatOleh: admin.id });
  revalidatePath("/", "layout");
  return { ok: true, message: `Pengumuman terkirim ke mahasiswa angkatan ${angkatan.join(", ")} yang belum mengisi buku tabungan.` };
}

"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { bukuTabungan, pengumumanMahasiswa } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { JENIS_PENGUMUMAN_BT } from "@/lib/buku-tabungan";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { hapusBerkas } from "@/lib/storage";

/** Admin menghapus kiriman buku tabungan yang keliru agar mahasiswa bisa mengirim ulang. */
export async function hapusBukuTabungan(id: string) {
  await requireAdmin();
  const db = await getDb();
  const [lama] = await db.select().from(bukuTabungan).where(eq(bukuTabungan.id, id));
  if (!lama) return;
  await db.delete(bukuTabungan).where(eq(bukuTabungan.id, id));
  await hapusBerkas(lama.fileUrl).catch(() => {});
  revalidatePath("/", "layout");
}

/** Banner ke mahasiswa angkatan 2026+ yang belum mengirim buku tabungan; hilang sendiri setelah masing-masing mengirim. */
export async function buatPengumumanBukuTabungan(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const v = nilaiForm(fd);
  const e: Record<string, string> = {};
  if (v.judul.length < 5 || v.judul.length > 150) e.judul = "Judul 5–150 karakter.";
  if (v.isi.length < 10 || v.isi.length > 2000) e.isi = "Isi pengumuman 10–2000 karakter.";
  if (v.tenggat && !/^\d{4}-\d{2}-\d{2}$/.test(v.tenggat)) e.tenggat = "Tanggal tenggat tidak valid.";
  if (Object.keys(e).length) return { errors: e, values: v };

  const db = await getDb();
  await db.insert(pengumumanMahasiswa).values({ judul: v.judul, isi: v.isi, jenis: JENIS_PENGUMUMAN_BT, tenggat: v.tenggat || null, dibuatOleh: admin.id });
  revalidatePath("/", "layout");
  return { ok: true, message: "Pengumuman terkirim ke mahasiswa yang belum mengisi buku tabungan." };
}

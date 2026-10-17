"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { pengumumanMahasiswa } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { nilaiForm, type FormState } from "@/lib/form-state";

/** Admin mengumumkan sesuatu ke seluruh mahasiswa (tampil sebagai banner di akun mahasiswa, tanpa email). */
export async function buatPengumumanMahasiswa(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const v = nilaiForm(fd);
  const e: Record<string, string> = {};
  if (v.judul.length < 5 || v.judul.length > 150) e.judul = "Judul 5–150 karakter.";
  if (v.isi.length < 10 || v.isi.length > 2000) e.isi = "Isi pengumuman 10–2000 karakter.";
  const semester = v.semester ? Number(v.semester) : null;
  if (semester !== null && (!Number.isInteger(semester) || semester < 1 || semester > 14)) e.semester = "Semester tidak valid.";
  if (v.tenggat && !/^\d{4}-\d{2}-\d{2}$/.test(v.tenggat)) e.tenggat = "Tanggal tenggat tidak valid.";
  if (Object.keys(e).length) return { errors: e, values: v };

  const db = await getDb();
  await db.insert(pengumumanMahasiswa).values({ judul: v.judul, isi: v.isi, semester, tenggat: v.tenggat || null, dibuatOleh: admin.id });
  revalidatePath("/", "layout");
  return { ok: true, message: "Pengumuman terkirim: langsung tampil di akun semua mahasiswa." };
}

/** Menutup pengumuman agar tidak tampil lagi di akun mahasiswa. */
export async function tutupPengumumanMahasiswa(id: string) {
  await requireAdmin();
  const db = await getDb();
  await db.update(pengumumanMahasiswa).set({ aktif: false }).where(eq(pengumumanMahasiswa.id, id));
  revalidatePath("/", "layout");
}

"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { laporanAkademik, pengumumanMahasiswa } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { MAKS_PESAN_HAPUS } from "@/lib/constants";
import { ringkasPerAngkatan } from "@/lib/pelaporan-akademik";
import { hapusBerkas } from "@/lib/storage";

/** Admin mengumumkan sesuatu ke mahasiswa angkatan terpilih, atau semua angkatan (tampil sebagai banner di akun mahasiswa, tanpa email). */
export async function buatPengumumanMahasiswa(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const v = nilaiForm(fd);
  const e: Record<string, string> = {};
  if (v.judul.length < 5 || v.judul.length > 150) e.judul = "Judul 5–150 karakter.";
  if (v.isi.length < 10 || v.isi.length > 2000) e.isi = "Isi pengumuman 10–2000 karakter.";
  const semester = v.semester ? Number(v.semester) : null;
  if (semester !== null && (!Number.isInteger(semester) || semester < 1 || semester > 14)) e.semester = "Semester tidak valid.";
  if (v.tenggat && !/^\d{4}-\d{2}-\d{2}$/.test(v.tenggat)) e.tenggat = "Tanggal tenggat tidak valid.";
  const dipilih = [...new Set(fd.getAll("angkatan").map((x) => Number(x)))].filter((n) => Number.isInteger(n) && n > 1900 && n < 2200).sort((a, b) => a - b);
  if (dipilih.length === 0) e.angkatan = "Pilih minimal satu angkatan.";
  if (Object.keys(e).length) return { errors: e, values: v };

  // Semua angkatan terpilih = tanpa sasaran, jadi angkatan yang muncul kemudian ikut menerima.
  const ada = (await ringkasPerAngkatan()).map((a) => a.angkatan);
  const semua = ada.every((a) => dipilih.includes(a));
  const db = await getDb();
  await db.insert(pengumumanMahasiswa).values({ judul: v.judul, isi: v.isi, semester, angkatanSasaran: semua ? null : dipilih.join(","), tenggat: v.tenggat || null, dibuatOleh: admin.id });
  revalidatePath("/", "layout");
  return { ok: true, message: semua ? "Pengumuman terkirim: langsung tampil di akun semua mahasiswa." : `Pengumuman terkirim: langsung tampil di akun mahasiswa angkatan ${dipilih.join(", ")}.` };
}

/** Menutup pengumuman agar tidak tampil lagi di akun mahasiswa. */
export async function tutupPengumumanMahasiswa(id: string) {
  await requireAdmin();
  const db = await getDb();
  await db.update(pengumumanMahasiswa).set({ aktif: false }).where(eq(pengumumanMahasiswa.id, id));
  revalidatePath("/", "layout");
}

/**
 * Admin menghapus laporan IPK satu semester yang keliru (beserta transkripnya) agar mahasiswa bisa melapor ulang.
 * `pesan` (opsional) menjelaskan kesalahannya; tampil sebagai banner pribadi di akun mahasiswa dan hilang sendiri
 * setelah ia melaporkan ulang semester itu.
 */
export async function hapusLaporanIpk(input: { pendaftaranId: string; semester: number; pesan?: string }) {
  const admin = await requireAdmin();
  const pesan = (input.pesan ?? "").trim();
  if (pesan.length > MAKS_PESAN_HAPUS) return { ok: false, message: `Pesan maksimal ${MAKS_PESAN_HAPUS} karakter.` };
  const db = await getDb();
  const [lama] = await db
    .select()
    .from(laporanAkademik)
    .where(and(eq(laporanAkademik.pendaftaranId, input.pendaftaranId), eq(laporanAkademik.semester, input.semester)));
  if (!lama) return { ok: false, message: "Laporan semester ini sudah tidak ada. Muat ulang halaman." };
  await db.delete(laporanAkademik).where(eq(laporanAkademik.id, lama.id));
  await hapusBerkas(lama.fileUrl).catch(() => {});
  if (pesan) {
    // Satu pesan aktif per semester: pesan lama untuk semester yang sama ditutup dulu.
    await db
      .update(pengumumanMahasiswa)
      .set({ aktif: false })
      .where(and(eq(pengumumanMahasiswa.pendaftaranId, lama.pendaftaranId), eq(pengumumanMahasiswa.semester, lama.semester)));
    await db.insert(pengumumanMahasiswa).values({
      judul: `Laporan IPK Semester ${lama.semester} dihapus admin`,
      isi: pesan,
      semester: lama.semester,
      pendaftaranId: lama.pendaftaranId,
      dibuatOleh: admin.id,
    });
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Laporan dihapus." };
}

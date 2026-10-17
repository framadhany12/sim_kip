"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { pendaftaran } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin, requirePendaftar } from "@/lib/auth";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { cariPendaftaranUser, sudahMahasiswa } from "@/lib/pendaftaran";
import { simpanAkademikCore, simpanDataDiriCore } from "@/lib/simpan-pendaftaran";
import { riwayatStatus } from "@/db/schema";

/** Akun yang statusnya Diterima; yang lain tidak boleh memakai aksi di berkas ini. */
async function ambilMahasiswa() {
  const user = await requirePendaftar();
  const p = await cariPendaftaranUser(user.id);
  if (!p || !sudahMahasiswa(p)) return null;
  return { user, p };
}

async function catat({ user, p }: NonNullable<Awaited<ReturnType<typeof ambilMahasiswa>>>, bagian: string) {
  const db = await getDb();
  await db.update(pendaftaran).set({ updatedAt: new Date() }).where(eq(pendaftaran.id, p.id));
  await db.insert(riwayatStatus).values({ pendaftaranId: p.id, status: p.status, catatan: `Mahasiswa memperbarui ${bagian}`, diubahOleh: user.id });
  revalidatePath("/", "layout");
}

const TOLAK: FormState = { message: "Menu Mahasiswa hanya untuk pendaftar yang sudah diterima." };

/** Identitas & alamat. Data KIP, NIK, dan pilihan jurusan tidak berubah lewat jalur ini. */
export async function simpanIdentitasMahasiswa(_: FormState, fd: FormData): Promise<FormState> {
  const m = await ambilMahasiswa();
  if (!m) return TOLAK;
  const hasil = await simpanDataDiriCore(m.p.id, nilaiForm(fd));
  if (hasil.galat) return hasil.galat;
  await catat(m, "Identitas & Alamat");
  redirect("/mahasiswa?tersimpan=identitas");
}

/** NIM & kelas, diisi sendiri setelah mendapat informasi dari bagian akademik. */
export async function simpanAkademikMahasiswa(_: FormState, fd: FormData): Promise<FormState> {
  const m = await ambilMahasiswa();
  if (!m) return TOLAK;
  // Sekali NIM dan kelas terisi, mahasiswa tidak dapat mengubahnya lagi; koreksi lewat admin.
  if (m.p.nim && m.p.kelas) return { message: "NIM dan kelas sudah tersimpan dan tidak dapat diubah lagi. Hubungi admin bila ada yang salah." };
  const hasil = await simpanAkademikCore(m.p.id, nilaiForm(fd));
  if (hasil.galat) return hasil.galat;
  await catat(m, "data akademik (NIM/kelas)");
  return { ok: true, message: "Data akademik tersimpan." };
}

/** Admin mengisi/mengoreksi NIM & kelas dari Master Mahasiswa. */
export async function simpanAkademikAdmin(pendaftaranId: string, _: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const db = await getDb();
  const [p] = await db.select().from(pendaftaran).where(eq(pendaftaran.id, pendaftaranId));
  if (!p || !sudahMahasiswa(p)) return { message: "Data mahasiswa tidak ditemukan." };
  const hasil = await simpanAkademikCore(p.id, nilaiForm(fd));
  if (hasil.galat) return hasil.galat;
  await db.insert(riwayatStatus).values({ pendaftaranId: p.id, status: p.status, catatan: "Admin memperbarui data akademik (NIM/kelas)", diubahOleh: admin.id });
  revalidatePath("/", "layout");
  return { ok: true, message: "Tersimpan." };
}

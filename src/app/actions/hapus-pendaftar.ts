"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { berkas, bukuTabungan, laporanAkademik, pendaftaran, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { hapusBerkas } from "@/lib/storage";

/**
 * Admin menghapus pendaftar: akun beserta seluruh datanya (data diri, keluarga, ekonomi, sekolah, jurusan,
 * berkas, riwayat, dst. ikut terhapus lewat cascade) dan berkas di storage. Tidak bisa dibatalkan.
 * Pendaftar yang sudah diterima (mahasiswa) tidak boleh dihapus dari sini.
 */
export async function hapusPendaftar(pendaftaranId: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const db = await getDb();
  const [p] = await db
    .select({ userId: pendaftaran.userId, status: pendaftaran.status, hasil: pendaftaran.hasil, email: users.email, role: users.role })
    .from(pendaftaran)
    .innerJoin(users, eq(users.id, pendaftaran.userId))
    .where(eq(pendaftaran.id, pendaftaranId));
  if (!p) return { ok: false, message: "Pendaftar tidak ditemukan." };
  if (p.role !== "pendaftar") return { ok: false, message: "Akun admin tidak bisa dihapus dari sini." };
  if (p.status === "diterima" && p.hasil === "diterima")
    return { ok: false, message: "Pendaftar yang diterima sudah menjadi mahasiswa dan tidak bisa dihapus dari sini." };

  const [b, l, t] = await Promise.all([
    db.select({ f: berkas.fileUrl }).from(berkas).where(eq(berkas.pendaftaranId, pendaftaranId)),
    db.select({ f: laporanAkademik.fileUrl }).from(laporanAkademik).where(eq(laporanAkademik.pendaftaranId, pendaftaranId)),
    db.select({ f: bukuTabungan.fileUrl }).from(bukuTabungan).where(eq(bukuTabungan.pendaftaranId, pendaftaranId)),
  ]);

  await db.delete(users).where(eq(users.id, p.userId));
  await Promise.all([...b, ...l, ...t].map((x) => hapusBerkas(x.f).catch(() => {})));
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Pendaftar dihapus." };
}

const BATAS_HAPUS_MASSAL = 200;

/**
 * Admin menghapus beberapa mahasiswa sekaligus dari Master Mahasiswa: akun beserta seluruh data (pendaftaran, IPK, buku tabungan,
 * kehadiran, riwayat) dan berkas di storage. Hanya akun pendaftar yang sudah diterima. Tidak bisa dibatalkan.
 */
export async function hapusMahasiswaTerpilih(pendaftaranIds: string[]): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const ids = [...new Set(pendaftaranIds.filter((x) => typeof x === "string" && x.length > 0))];
  if (ids.length === 0) return { ok: false, message: "Pilih minimal satu mahasiswa." };
  if (ids.length > BATAS_HAPUS_MASSAL) return { ok: false, message: `Maksimal ${BATAS_HAPUS_MASSAL} mahasiswa sekali hapus.` };

  const db = await getDb();
  const rows = await db
    .select({ id: pendaftaran.id, userId: pendaftaran.userId, email: users.email })
    .from(pendaftaran)
    .innerJoin(users, eq(users.id, pendaftaran.userId))
    .where(and(inArray(pendaftaran.id, ids), eq(pendaftaran.status, "diterima"), eq(pendaftaran.hasil, "diterima"), eq(users.role, "pendaftar")));
  const boleh = rows;
  if (boleh.length === 0) return { ok: false, message: "Tidak ada mahasiswa yang bisa dihapus dari pilihan ini." };

  const pid = boleh.map((r) => r.id);
  const [b, l, t] = await Promise.all([
    db.select({ f: berkas.fileUrl }).from(berkas).where(inArray(berkas.pendaftaranId, pid)),
    db.select({ f: laporanAkademik.fileUrl }).from(laporanAkademik).where(inArray(laporanAkademik.pendaftaranId, pid)),
    db.select({ f: bukuTabungan.fileUrl }).from(bukuTabungan).where(inArray(bukuTabungan.pendaftaranId, pid)),
  ]);

  await db.delete(users).where(inArray(users.id, boleh.map((r) => r.userId)));
  // File di disk dihapus setelah baris database; yang gagal dihapus tidak menggagalkan penghapusan.
  const berkasDisk = [...b, ...l, ...t];
  for (let i = 0; i < berkasDisk.length; i += 50) await Promise.all(berkasDisk.slice(i, i + 50).map((x) => hapusBerkas(x.f).catch(() => {})));
  revalidatePath("/admin", "layout");
  const dilewati = ids.length - boleh.length;
  return { ok: true, message: `${boleh.length} mahasiswa dihapus${dilewati ? `, ${dilewati} dilewati` : ""}.` };
}

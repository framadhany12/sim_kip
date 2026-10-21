"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { dataDiri, jenisBeasiswa, pendaftaran, sessions, STATUS_MAHASISWA, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin, requirePendaftar } from "@/lib/auth";
import { STATUS_MAHASISWA_LABEL, tanggalPanjang } from "@/lib/constants";
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
  const db = await getDb();
  const [lama] = await db.select().from(dataDiri).where(eq(dataDiri.pendaftaranId, m.p.id));
  if (!lama) return { message: "Data diri belum lengkap. Hubungi admin." };
  // Data KIP dikunci di server: nilai dari form (input hidden) diabaikan agar tidak bisa dimanipulasi.
  const v = {
    ...nilaiForm(fd),
    nomorPendaftaranKip: lama.nomorPendaftaranKip ?? "",
    desil: lama.desil ?? "",
    penerimaPip: lama.penerimaPip == null ? "" : lama.penerimaPip ? "ya" : "tidak",
  };
  const hasil = await simpanDataDiriCore(m.p.id, v);
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
  const v = nilaiForm(fd);
  const [b] = v.jenisBeasiswaId ? await db.select({ id: jenisBeasiswa.id }).from(jenisBeasiswa).where(eq(jenisBeasiswa.id, v.jenisBeasiswaId)) : [];
  if (v.jenisBeasiswaId && !b) return { errors: { jenisBeasiswaId: "Jenis beasiswa tidak ditemukan." }, values: v };
  const hasil = await simpanAkademikCore(p.id, v);
  if (hasil.galat) return hasil.galat;
  await db.update(pendaftaran).set({ jenisBeasiswaId: b?.id ?? null }).where(eq(pendaftaran.id, p.id));
  await db.insert(riwayatStatus).values({ pendaftaranId: p.id, status: p.status, catatan: "Admin memperbarui data akademik (NIM/kelas/jenis beasiswa)", diubahOleh: admin.id });
  revalidatePath("/", "layout");
  return { ok: true, message: "Tersimpan." };
}

/**
 * Admin mengubah status mahasiswa. Selain Aktif, akun dinonaktifkan dan semua sesinya dicabut;
 * kembali ke Aktif mengaktifkan akun lagi. Setiap perubahan dicatat di riwayat.
 */
export async function ubahStatusMahasiswa(pendaftaranId: string, _: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const v: Record<string, string> = { tanggal: "", keterangan: "", ...nilaiForm(fd) };
  const status = STATUS_MAHASISWA.find((s) => s === v.statusMahasiswa);
  const e: Record<string, string> = {};
  if (!status) e.statusMahasiswa = "Pilih status mahasiswa.";
  const tgl = v.tanggal && /^\d{4}-\d{2}-\d{2}$/.test(v.tanggal) && !Number.isNaN(Date.parse(`${v.tanggal}T00:00:00Z`)) ? v.tanggal : "";
  if (!tgl) e.tanggal = "Isi tanggal berlakunya status.";
  if ((status === "dicabut" || status === "tidak_aktif") && !v.keterangan) e.keterangan = "Tuliskan alasannya, misalnya nomor SK atau penyebab berhenti.";
  if (v.keterangan.length > 255) e.keterangan = "Maksimal 255 karakter.";
  if (Object.keys(e).length) return { errors: e, values: v };

  const db = await getDb();
  const [p] = await db.select().from(pendaftaran).where(eq(pendaftaran.id, pendaftaranId));
  if (!p || !sudahMahasiswa(p)) return { message: "Data mahasiswa tidak ditemukan." };
  const keterangan = v.keterangan || null;
  if (p.statusMahasiswa === status && p.statusMahasiswaTanggal === tgl && p.statusMahasiswaKeterangan === keterangan) return { message: "Tidak ada perubahan." };

  const aktif = status === "aktif";
  await db.transaction(async (tx) => {
    await tx.update(pendaftaran).set({ statusMahasiswa: status, statusMahasiswaTanggal: tgl, statusMahasiswaKeterangan: keterangan, updatedAt: new Date() }).where(eq(pendaftaran.id, p.id));
    await tx.update(users).set({ aktif }).where(eq(users.id, p.userId));
    if (!aktif) await tx.delete(sessions).where(eq(sessions.userId, p.userId));
    await tx.insert(riwayatStatus).values({
      pendaftaranId: p.id,
      status: `mhs:${status}`,
      catatan: `Berlaku ${tanggalPanjang(tgl)}.${keterangan ? ` ${keterangan}` : ""}`,
      diubahOleh: admin.id,
    });
  });
  revalidatePath("/", "layout");
  const label = STATUS_MAHASISWA_LABEL[status!];
  return { ok: true, message: aktif ? `Status diubah menjadi ${label}. Akun mahasiswa aktif.` : `Status diubah menjadi ${label}. Akun dinonaktifkan dan dikeluarkan dari semua perangkat.` };
}

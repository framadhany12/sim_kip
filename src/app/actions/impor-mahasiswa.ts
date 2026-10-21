"use server";

import { revalidatePath } from "next/cache";
import { inArray, or } from "drizzle-orm";
import { getDb } from "@/db";
import { dataDiri, pendaftaran, riwayatStatus, users } from "@/db/schema";
import { EMAIL_RE } from "@/lib/anti-bot";
import { requireAdmin } from "@/lib/auth";
import { bacaTabel, type Sel } from "@/lib/baca-tabel";
import { hashPassword } from "@/lib/password";
import { TAHUN_MIN, tahunSekarang } from "@/lib/tahun";

export type BarisGagal = { baris: number; nama: string; alasan: string };
export type HasilImpor = { galat: string } | { dibuat: number; gagal: BarisGagal[] } | null;

const MAKS_BERKAS = 900 * 1024;
const MAKS_BARIS = 1000;

/** Cari kolom dari baris judul; urutan kolom di file bebas. */
function petaKolom(judul: string[]) {
  const cari = (re: RegExp) => judul.findIndex((c) => re.test(c));
  return { nama: cari(/nama/), nik: cari(/\bnik\b|kependudukan/), email: cari(/e-?mail|surel/), angkatan: cari(/angkatan|tahun masuk/) };
}

/**
 * Impor akun mahasiswa lama (sudah berkuliah sebelum aplikasi dipakai). Akun langsung terverifikasi dan masuk Master Mahasiswa,
 * sandi awal = NIK dan wajib diganti saat login pertama. Baris yang tidak valid atau sudah punya akun dilewati dan dilaporkan.
 */
export async function imporMahasiswa(_: HasilImpor, fd: FormData): Promise<HasilImpor> {
  const admin = await requireAdmin();
  const file = fd.get("berkas");
  if (!(file instanceof File) || file.size === 0) return { galat: "Pilih berkas Excel (.xlsx) atau CSV." };
  if (!/\.(xlsx|csv)$/i.test(file.name)) return { galat: "Format harus .xlsx atau .csv." };
  if (file.size > MAKS_BERKAS) return { galat: "Berkas maksimal 900 KB. Pecah menjadi beberapa berkas." };

  let rows: Sel[][];
  try {
    rows = await bacaTabel(file);
  } catch {
    return { galat: "Berkas tidak bisa dibaca. Pastikan formatnya .xlsx atau .csv yang valid." };
  }
  const iJudul = rows.findIndex((r) => r.some((c) => /\bnik\b/i.test(c.teks)) && r.some((c) => /nama/i.test(c.teks)));
  if (iJudul < 0) return { galat: "Baris judul tidak ditemukan. Gunakan templat: kolom Nama, NIK, Email, dan Angkatan." };
  const k = petaKolom(rows[iJudul].map((c) => c.teks.toLowerCase()));
  const kurang = (Object.keys(k) as (keyof typeof k)[]).filter((x) => k[x] < 0);
  if (kurang.length) return { galat: `Kolom ${kurang.join(", ")} tidak ditemukan. Gunakan templat yang disediakan.` };

  const tahunIni = tahunSekarang();
  const gagal: BarisGagal[] = [];
  const calon: { baris: number; nama: string; nik: string; email: string; angkatan: number }[] = [];
  const sudahNik = new Set<string>();
  const sudahEmail = new Set<string>();
  rows.slice(iJudul + 1).forEach((r, i) => {
    const baris = iJudul + i + 2;
    const sel = (j: number): Sel => r[j] ?? { teks: "", angka: false };
    const nama = sel(k.nama).teks.replace(/\s+/g, " ");
    const nikSel = sel(k.nik);
    const nik = nikSel.teks.replace(/\D/g, "");
    const email = sel(k.email).teks.toLowerCase();
    const angkatan = Number(sel(k.angkatan).teks);
    if (!nama && !nik && !email) return;
    const tolak = (alasan: string) => gagal.push({ baris, nama: nama || "(tanpa nama)", alasan });
    if (nama.length < 3 || nama.length > 150) return tolak("Nama harus 3–150 karakter.");
    if (nikSel.angka) return tolak("Sel NIK berformat angka sehingga digit terakhir bisa berubah. Format kolom NIK sebagai Teks, lalu ketik ulang.");
    if (nik.length !== 16) return tolak("NIK harus 16 digit.");
    if (!EMAIL_RE.test(email)) return tolak("Email tidak valid.");
    if (!Number.isInteger(angkatan) || angkatan < TAHUN_MIN || angkatan > tahunIni) return tolak(`Angkatan harus tahun ${TAHUN_MIN}–${tahunIni}.`);
    if (sudahNik.has(nik)) return tolak("NIK muncul lebih dari sekali di berkas.");
    if (sudahEmail.has(email)) return tolak("Email muncul lebih dari sekali di berkas.");
    sudahNik.add(nik);
    sudahEmail.add(email);
    calon.push({ baris, nama, nik, email, angkatan });
  });
  if (calon.length + gagal.length > MAKS_BARIS) return { galat: `Maksimal ${MAKS_BARIS} baris per impor. Pecah menjadi beberapa berkas.` };

  const db = await getDb();
  const dipakaiNik = new Set<string>();
  const dipakaiEmail = new Set<string>();
  for (let i = 0; i < calon.length; i += 500) {
    const potong = calon.slice(i, i + 500);
    const niks = potong.map((c) => c.nik);
    const [akun, diri] = await Promise.all([
      db.select({ nik: users.nik, email: users.email }).from(users).where(or(inArray(users.nik, niks), inArray(users.email, potong.map((c) => c.email)))),
      db.select({ nik: dataDiri.nik }).from(dataDiri).where(inArray(dataDiri.nik, niks)),
    ]);
    for (const a of akun) {
      if (a.nik) dipakaiNik.add(a.nik);
      dipakaiEmail.add(a.email);
    }
    for (const x of diri) dipakaiNik.add(x.nik);
  }
  const siap = calon.filter((c) => {
    const alasan = dipakaiNik.has(c.nik) ? "NIK sudah dipakai akun atau pendaftar lain." : dipakaiEmail.has(c.email) ? "Email sudah dipakai akun lain." : null;
    if (alasan) gagal.push({ baris: c.baris, nama: c.nama, alasan });
    return !alasan;
  });

  // scrypt sengaja lambat; dikerjakan berkelompok agar tidak memblokir server terlalu lama.
  const hash = new Map<string, string>();
  for (let i = 0; i < siap.length; i += 10) {
    const h = await Promise.all(siap.slice(i, i + 10).map((c) => hashPassword(c.nik)));
    siap.slice(i, i + 10).forEach((c, j) => hash.set(c.nik, h[j]));
  }

  const sekarang = new Date();
  await db.transaction(async (tx) => {
    for (const c of siap) {
      const userId = crypto.randomUUID();
      const pendaftaranId = crypto.randomUUID();
      await tx.insert(users).values({
        id: userId,
        nama: c.nama,
        email: c.email,
        nik: c.nik,
        passwordHash: hash.get(c.nik)!,
        role: "pendaftar",
        emailVerifiedAt: sekarang,
        mahasiswaLama: true,
        wajibGantiSandi: true,
      });
      await tx.insert(pendaftaran).values({
        id: pendaftaranId,
        userId,
        gelombang: `Mahasiswa lama ${c.angkatan}`,
        status: "diterima",
        tahap: "pengumuman",
        hasil: "diterima",
        angkatan: c.angkatan,
      });
      await tx.insert(riwayatStatus).values({ pendaftaranId, status: "impor", catatan: `Akun mahasiswa angkatan ${c.angkatan} dibuat lewat impor`, diubahOleh: admin.id });
    }
  });
  revalidatePath("/admin/master-mahasiswa");
  return { dibuat: siap.length, gagal: gagal.sort((a, b) => a.baris - b.baris) };
}

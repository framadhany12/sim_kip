"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { dataSekolah, sekolah } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { bacaTabel } from "@/lib/baca-tabel";
import { kataCariSekolah } from "@/lib/sekolah";

/**
 * Tambah/ubah sekolah di master. Menyimpan perubahan dari admin juga menandai sekolah sebagai sudah diperiksa (sumber admin).
 * Nama/NPSN yang diubah ikut diperbarui di data sekolah pendaftar yang memakai NPSN lama.
 */
export async function simpanSekolahMaster(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const v = nilaiForm(fd);
  const id = v.id || null;
  const nama = v.nama.replace(/\s+/g, " ");
  const npsn = v.npsn.replace(/\D/g, "");
  const e: Record<string, string> = {};
  if (nama.length < 3 || nama.length > 150) e.nama = "Nama sekolah 3–150 karakter.";
  if (npsn.length !== 8) e.npsn = "NPSN terdiri dari 8 digit angka.";
  if (v.kota.length > 100) e.kota = "Maksimal 100 karakter.";
  const db = await getDb();
  if (!e.npsn) {
    const [dup] = await db
      .select({ nama: sekolah.nama })
      .from(sekolah)
      .where(id ? and(eq(sekolah.npsn, npsn), ne(sekolah.id, id)) : eq(sekolah.npsn, npsn));
    if (dup) e.npsn = `NPSN ini sudah dipakai "${dup.nama}".`;
  }
  if (Object.keys(e).length) return { errors: e, values: v };
  const data = { nama, npsn, kota: v.kota || null, kataCari: kataCariSekolah(nama, v.kota), sumber: "admin" as const };
  if (id) {
    const [lama] = await db.select().from(sekolah).where(eq(sekolah.id, id));
    if (!lama) return { message: "Sekolah tidak ditemukan." };
    await db.transaction(async (tx) => {
      await tx.update(sekolah).set(data).where(eq(sekolah.id, id));
      if (lama.nama !== nama || lama.npsn !== npsn)
        await tx.update(dataSekolah).set({ namaSekolah: nama, npsn }).where(eq(dataSekolah.npsn, lama.npsn));
    });
  } else await db.insert(sekolah).values(data);
  revalidatePath("/admin/sekolah");
  return { ok: true, message: id ? "Data sekolah diperbarui." : "Sekolah ditambahkan." };
}

/** Tandai sekolah tambahan pendaftar sebagai sudah diperiksa tanpa mengubah datanya. */
export async function sahkanSekolah(fd: FormData) {
  await requireAdmin();
  const db = await getDb();
  await db.update(sekolah).set({ sumber: "admin" }).where(eq(sekolah.id, String(fd.get("id"))));
  revalidatePath("/admin/sekolah");
}

/** Data sekolah pendaftar menyimpan salinan nama + NPSN sendiri, jadi menghapus dari master tidak mengubah isian mereka. */
export async function hapusSekolah(fd: FormData) {
  await requireAdmin();
  const db = await getDb();
  await db.delete(sekolah).where(eq(sekolah.id, String(fd.get("id"))));
  revalidatePath("/admin/sekolah");
}

const MAKS_BERKAS = 900 * 1024;

/** Baca baris [npsn, nama, kota] dari .xlsx atau .csv; baris judul dicari dari sel yang memuat "npsn" dan "nama". */
async function bacaBaris(file: File): Promise<string[][]> {
  const rows = (await bacaTabel(file)).map((r) => r.map((c) => c.teks));
  const iJudul = rows.findIndex((r) => r.some((c) => /npsn/i.test(c)) && r.some((c) => /nama/i.test(c)));
  if (iJudul < 0) return [];
  const judul = rows[iJudul].map((c) => c.toLowerCase());
  const kNpsn = judul.findIndex((c) => c.includes("npsn"));
  const kNama = [judul.findIndex((c) => /nama/.test(c) && /sekolah|satuan/.test(c)), judul.findIndex((c) => c.includes("nama") && !/kota|kab|prov|kec/.test(c))].find((i) => i >= 0) ?? -1;
  if (kNpsn < 0 || kNama < 0) return [];
  const kKota = judul.findIndex((c) => /kota|kab/.test(c));
  return rows.slice(iJudul + 1).map((r) => [r[kNpsn] ?? "", r[kNama] ?? "", kKota >= 0 ? (r[kKota] ?? "") : ""]);
}

/**
 * Import master sekolah dari Excel/CSV (kolom NPSN, Nama sekolah, Kabupaten/kota opsional).
 * NPSN yang sudah ada dilewati, kecuali "perbarui" dicentang: nama/kota diganti dan ikut diperbarui di data pendaftar.
 */
export async function importSekolah(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const file = fd.get("berkas");
  if (!(file instanceof File) || file.size === 0) return { errors: { berkas: "Pilih berkas Excel (.xlsx) atau CSV." } };
  if (!/\.(xlsx|csv)$/i.test(file.name)) return { errors: { berkas: "Format harus .xlsx atau .csv." } };
  if (file.size > MAKS_BERKAS) return { errors: { berkas: "Berkas maksimal 900 KB. Pecah menjadi beberapa berkas bila perlu." } };
  const perbarui = fd.get("perbarui") === "on";

  let baris: string[][];
  try {
    baris = await bacaBaris(file);
  } catch {
    return { errors: { berkas: "Berkas tidak bisa dibaca. Pastikan formatnya .xlsx atau .csv yang valid." } };
  }
  if (baris.length === 0) return { errors: { berkas: "Baris judul tidak ditemukan. Baris pertama harus memuat kolom NPSN dan Nama sekolah." } };

  const unik = new Map<string, { npsn: string; nama: string; kota: string | null }>();
  let tidakValid = 0;
  for (const [n, nm, k] of baris) {
    if (!n && !nm) continue;
    const npsn = n.replace(/\D/g, "");
    const nama = nm.replace(/\s+/g, " ").trim();
    if (npsn.length !== 8 || nama.length < 3 || nama.length > 150) {
      tidakValid++;
      continue;
    }
    unik.set(npsn, { npsn, nama, kota: k.replace(/\s+/g, " ").trim().slice(0, 100) || null });
  }
  if (unik.size === 0) return { message: `Tidak ada baris yang valid (${tidakValid} baris NPSN/nama tidak sesuai).` };

  const db = await getDb();
  const semua = [...unik.values()];
  const lama = new Map<string, { nama: string; kota: string | null }>();
  for (let i = 0; i < semua.length; i += 500) {
    const ada = await db
      .select({ npsn: sekolah.npsn, nama: sekolah.nama, kota: sekolah.kota })
      .from(sekolah)
      .where(inArray(sekolah.npsn, semua.slice(i, i + 500).map((s) => s.npsn)));
    for (const s of ada) lama.set(s.npsn, s);
  }
  const baru = semua.filter((s) => !lama.has(s.npsn));
  const diubah = perbarui ? semua.filter((s) => lama.has(s.npsn) && (lama.get(s.npsn)!.nama !== s.nama || lama.get(s.npsn)!.kota !== s.kota)) : [];

  await db.transaction(async (tx) => {
    for (let i = 0; i < baru.length; i += 500)
      await tx.insert(sekolah).values(baru.slice(i, i + 500).map((s) => ({ ...s, kataCari: kataCariSekolah(s.nama, s.kota), sumber: "admin" as const })));
    for (const s of diubah) {
      await tx.update(sekolah).set({ nama: s.nama, kota: s.kota, kataCari: kataCariSekolah(s.nama, s.kota), sumber: "admin" }).where(eq(sekolah.npsn, s.npsn));
      await tx.update(dataSekolah).set({ namaSekolah: s.nama }).where(eq(dataSekolah.npsn, s.npsn));
    }
  });
  revalidatePath("/admin/sekolah");
  const dilewati = semua.length - baru.length - diubah.length;
  const bagian = [`${baru.length} sekolah ditambahkan`];
  if (diubah.length) bagian.push(`${diubah.length} diperbarui`);
  if (dilewati) bagian.push(`${dilewati} sudah ada (dilewati)`);
  if (tidakValid) bagian.push(`${tidakValid} baris tidak valid`);
  return { ok: true, message: bagian.join(", ") + "." };
}

"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { pengaturan } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { KUNCI_LANDING, type LandingKonten } from "@/lib/landing";

const baris = (s: string | undefined) =>
  (s ?? "")
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);

/** Baris "Judul | Isi" menjadi pasangan; null bila ada baris yang tidak punya pemisah "|". */
function pasangan(s: string | undefined) {
  const hasil: { judul: string; isi: string }[] = [];
  for (const b of baris(s)) {
    const i = b.indexOf("|");
    const judul = i < 0 ? "" : b.slice(0, i).trim();
    const isi = i < 0 ? "" : b.slice(i + 1).trim();
    if (!judul || !isi) return null;
    hasil.push({ judul, isi });
  }
  return hasil;
}

function wajib(e: Record<string, string>, k: string, v: string | undefined, maks: number, label: string) {
  if (!v) e[k] = `${label} wajib diisi.`;
  else if (v.length > maks) e[k] = `${label} maksimal ${maks} karakter.`;
}

function maksBaris(e: Record<string, string>, k: string, item: unknown[], maks: number, label: string) {
  if (item.length === 0) e[k] = `${label} minimal satu baris.`;
  else if (item.length > maks) e[k] = `${label} maksimal ${maks} baris.`;
}

/** Menyimpan seluruh isi landing page. Berlaku langsung bagi pengunjung berikutnya. */
export async function simpanLanding(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const v = nilaiForm(fd);
  const e: Record<string, string> = {};

  const bannerAktif = fd.get("bannerAktif") === "on";
  if (bannerAktif && !v.bannerTeks) e.bannerTeks = "Isi teks pengumuman atau matikan pengumuman.";
  if ((v.bannerTeks ?? "").length > 400) e.bannerTeks = "Teks pengumuman maksimal 400 karakter.";
  wajib(e, "heroJudul", v.heroJudul, 150, "Judul");
  if ((v.heroSorot ?? "").length > 100) e.heroSorot = "Teks sorot maksimal 100 karakter.";
  wajib(e, "heroDeskripsi", v.heroDeskripsi, 400, "Deskripsi");
  wajib(e, "syaratJudul", v.syaratJudul, 100, "Judul");
  const syarat = baris(v.syaratItem);
  maksBaris(e, "syaratItem", syarat, 12, "Persyaratan");
  wajib(e, "berkasJudul", v.berkasJudul, 100, "Judul");
  const berkas = baris(v.berkasItem);
  maksBaris(e, "berkasItem", berkas, 15, "Daftar berkas");
  if ((v.berkasCatatan ?? "").length > 300) e.berkasCatatan = "Catatan maksimal 300 karakter.";
  wajib(e, "kipJudul", v.kipJudul, 150, "Judul");
  wajib(e, "kipRingkas", v.kipRingkas, 800, "Penjelasan");
  const sasaran = baris(v.kipSasaran);
  maksBaris(e, "kipSasaran", sasaran, 8, "Sasaran");
  const manfaat = pasangan(v.kipManfaat);
  if (!manfaat) e.kipManfaat = "Setiap baris harus berformat: Judul | Isi.";
  else maksBaris(e, "kipManfaat", manfaat, 6, "Manfaat");
  wajib(e, "alurJudul", v.alurJudul, 150, "Judul");
  const langkah = pasangan(v.alurLangkah);
  if (!langkah) e.alurLangkah = "Setiap baris harus berformat: Judul | Isi.";
  else maksBaris(e, "alurLangkah", langkah, 8, "Langkah");
  wajib(e, "kampusRingkas", v.kampusRingkas, 800, "Profil kampus");
  wajib(e, "kampusAlamat", v.kampusAlamat, 250, "Alamat");
  for (const [k, l, maks] of [["syaratItem", "Persyaratan", 200], ["berkasItem", "Berkas", 150], ["kipSasaran", "Sasaran", 300]] as const) {
    const lebih = baris(v[k]).find((x) => x.length > maks);
    if (lebih && !e[k]) e[k] = `Tiap baris ${l.toLowerCase()} maksimal ${maks} karakter.`;
  }
  if (Object.keys(e).length) return { errors: e, values: v, message: "Ada isian yang perlu diperbaiki; periksa tanda merah di bawah." };

  const konten: LandingKonten = {
    banner: { aktif: bannerAktif, teks: v.bannerTeks ?? "" },
    hero: { judul: v.heroJudul, sorot: v.heroSorot ?? "", deskripsi: v.heroDeskripsi },
    syarat: { judul: v.syaratJudul, item: syarat },
    berkas: { judul: v.berkasJudul, item: berkas, catatan: v.berkasCatatan ?? "" },
    kip: { judul: v.kipJudul, ringkas: v.kipRingkas, sasaran, manfaat: manfaat! },
    alur: { judul: v.alurJudul, langkah: langkah! },
    kampus: { ringkas: v.kampusRingkas, alamat: v.kampusAlamat },
  };
  const db = await getDb();
  const data = { nilai: JSON.stringify(konten), diubahOleh: admin.id, updatedAt: new Date() };
  await db.insert(pengaturan).values({ kunci: KUNCI_LANDING, ...data }).onDuplicateKeyUpdate({ set: data });
  revalidatePath("/");
  revalidatePath("/admin/landing");
  return { ok: true, message: "Landing page diperbarui dan langsung tampil di halaman depan." };
}

/** Menghapus perubahan sehingga landing page kembali ke isi bawaan. */
export async function pulihkanLanding(): Promise<FormState> {
  await requireAdmin();
  const db = await getDb();
  await db.delete(pengaturan).where(eq(pengaturan.kunci, KUNCI_LANDING));
  revalidatePath("/");
  revalidatePath("/admin/landing");
  return { ok: true, message: "Landing page dikembalikan ke isi bawaan." };
}

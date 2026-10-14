import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Penyimpanan berkas lokal (folder `storage/` di luar `public/`, jadi tidak bisa diakses langsung).
 * Berkas hanya dilayani lewat /api/berkas/[id] setelah cek hak akses.
 * Untuk produksi di Vercel, ganti dua fungsi ini dengan object storage (R2/S3/Supabase).
 */
const ROOT = path.join(process.cwd(), "storage");

export async function simpanBerkas(relPath: string, data: Buffer) {
  const full = path.join(ROOT, relPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, data);
}

export async function bacaBerkas(relPath: string) {
  return fs.readFile(path.join(ROOT, relPath));
}

export async function hapusBerkas(relPath: string) {
  await fs.rm(path.join(ROOT, relPath), { force: true });
}

/** Deteksi tipe dari isi berkas (magic bytes), bukan dari nama/ekstensi kiriman browser. */
export function deteksiTipe(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.subarray(0, 4).toString("latin1") === "%PDF") return { mime: "application/pdf", ext: "pdf" };
  if (buf[0] === 0x89 && buf.subarray(1, 4).toString("latin1") === "PNG") return { mime: "image/png", ext: "png" };
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  return null;
}

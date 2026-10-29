import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { bukuTabungan } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { bukuTabunganSaya, MAX_BUKU_TABUNGAN_MB, wajibBukuTabungan } from "@/lib/buku-tabungan";
import { cariPendaftaranUser, isDuplikat } from "@/lib/pendaftaran";
import { deteksiTipe, hapusBerkas, simpanBerkas } from "@/lib/storage";

const err = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
const MAX_BYTE = MAX_BUKU_TABUNGAN_MB * 1024 * 1024;

/** Mahasiswa angkatan 2026+ mengirim No. Rek KIP-K + buku tabungan. Hanya sekali; bila keliru admin menghapusnya lalu mahasiswa mengirim ulang. */
export async function POST(req: Request) {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTE + 64 * 1024) return err(`Ukuran berkas maksimal ${MAX_BUKU_TABUNGAN_MB} MB.`, 413);
  const user = await getCurrentUser();
  if (!user || user.role !== "pendaftar") return err("Silakan masuk terlebih dahulu.", 401);
  const p = await cariPendaftaranUser(user.id);
  if (!p || !(await wajibBukuTabungan(p.id))) return err(`Buku tabungan hanya untuk mahasiswa KIP Kuliah angkatan 2026 ke atas.`, 403);
  if (await bukuTabunganSaya(p.id)) return err("Buku tabungan sudah dikirim. Hubungi admin bila ada kesalahan.", 409);

  const fd = await req.formData();
  const noRekening = String(fd.get("noRekening") ?? "").replace(/[\s.-]/g, "");
  if (!/^\d{6,30}$/.test(noRekening)) return err("Nomor rekening hanya angka, 6 sampai 30 digit.");
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return err("Unggah foto atau scan buku tabungan.");
  if (file.size > MAX_BYTE) return err(`Ukuran berkas maksimal ${MAX_BUKU_TABUNGAN_MB} MB.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const tipe = deteksiTipe(buf);
  if (!tipe) return err("Format berkas harus PDF, JPG, atau PNG.");

  const rel = `${p.id}/buku-tabungan-${Date.now()}.${tipe.ext}`;
  await simpanBerkas(rel, buf);
  try {
    const db = await getDb();
    await db.insert(bukuTabungan).values({ pendaftaranId: p.id, noRekening, fileUrl: rel, namaAsli: file.name.slice(0, 200), mimeType: tipe.mime, ukuran: file.size });
  } catch (e) {
    await hapusBerkas(rel).catch(() => {});
    // Dua kiriman bersamaan: yang kalah ditolak seperti kiriman ulang.
    if (isDuplikat(e)) return err("Buku tabungan sudah dikirim. Hubungi admin bila ada kesalahan.", 409);
    throw e;
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}

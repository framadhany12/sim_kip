import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { laporanAkademik } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { MAX_FILE_MB } from "@/lib/constants";
import { cariPendaftaranUser, sudahMahasiswa } from "@/lib/pendaftaran";
import { deteksiTipe, hapusBerkas, simpanBerkas } from "@/lib/storage";

const err = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

/** Mahasiswa mengirim IPK satu semester beserta transkripnya; mengirim ulang semester yang sama menggantikan laporan sebelumnya. */
export async function POST(req: Request) {
  const panjang = Number(req.headers.get("content-length") ?? 0);
  if (panjang > MAX_FILE_MB * 1024 * 1024 + 64 * 1024) return err(`Ukuran berkas maksimal ${MAX_FILE_MB} MB.`, 413);
  const user = await getCurrentUser();
  if (!user || user.role !== "pendaftar") return err("Silakan masuk terlebih dahulu.", 401);
  const p = await cariPendaftaranUser(user.id);
  if (!p || !sudahMahasiswa(p)) return err("Pelaporan hanya untuk mahasiswa yang sudah diterima.", 403);

  const fd = await req.formData();
  const semester = Number(fd.get("semester"));
  if (!Number.isInteger(semester) || semester < 1 || semester > 14) return err("Pilih semester (1–14).");
  const ipk = Number(String(fd.get("ipk") ?? "").replace(",", "."));
  if (!Number.isFinite(ipk) || ipk < 0 || ipk > 4) return err("IPK harus antara 0,00 dan 4,00.");
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return err("Unggah berkas transkrip nilai.");
  if (file.size > MAX_FILE_MB * 1024 * 1024) return err(`Ukuran berkas maksimal ${MAX_FILE_MB} MB.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const tipe = deteksiTipe(buf);
  if (!tipe) return err("Format berkas harus PDF, JPG, atau PNG.");

  const db = await getDb();
  const [lama] = await db.select().from(laporanAkademik).where(and(eq(laporanAkademik.pendaftaranId, p.id), eq(laporanAkademik.semester, semester)));
  const rel = `${p.id}/transkrip-s${semester}-${Date.now()}.${tipe.ext}`;
  await simpanBerkas(rel, buf);
  const data = { ipk: ipk.toFixed(2), fileUrl: rel, namaAsli: file.name.slice(0, 200), mimeType: tipe.mime, ukuran: file.size, updatedAt: new Date() };
  await db
    .insert(laporanAkademik)
    .values({ pendaftaranId: p.id, semester, ...data })
    .onDuplicateKeyUpdate({ set: data });
  if (lama) await hapusBerkas(lama.fileUrl);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}

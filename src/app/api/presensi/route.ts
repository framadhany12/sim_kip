import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { presensiKegiatan } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ambilKegiatan, kodeValid, statusKegiatan } from "@/lib/kegiatan";
import { cariPendaftaranUser, isDuplikat, sudahMahasiswa } from "@/lib/pendaftaran";

const jawab = (message: string, status: number, ekstra: object = {}) => NextResponse.json({ ...(status < 300 ? { ok: true } : { error: message }), message, ...ekstra }, { status });

/** Mahasiswa mencatat kehadiran dengan kode dari barcode kegiatan. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "pendaftar") return jawab("Silakan masuk sebagai mahasiswa.", 401);
  const p = await cariPendaftaranUser(user.id);
  if (!p || !sudahMahasiswa(p)) return jawab("Presensi hanya untuk mahasiswa.", 403);

  const body = (await req.json().catch(() => ({}))) as { kegiatanId?: string; token?: string };
  if (typeof body.kegiatanId !== "string" || typeof body.token !== "string" || !body.kegiatanId || !body.token) return jawab("Barcode tidak valid.", 400);
  const k = await ambilKegiatan(body.kegiatanId);
  if (!k) return jawab("Kegiatan tidak ditemukan.", 404);
  if (!kodeValid(k.rahasia, body.token)) return jawab("Barcode sudah kedaluwarsa. Pindai ulang barcode yang sedang tampil.", 400);
  const status = statusKegiatan(k);
  if (status === "akan") return jawab("Kegiatan belum dimulai.", 400);
  if (status === "selesai") return jawab("Kegiatan sudah selesai.", 400);

  const db = await getDb();
  try {
    await db.insert(presensiKegiatan).values({ kegiatanId: k.id, pendaftaranId: p.id });
  } catch (e) {
    if (isDuplikat(e)) return jawab("Kehadiran Anda sudah tercatat sebelumnya.", 200, { nama: k.nama, sudah: true });
    throw e;
  }
  revalidatePath("/", "layout");
  return jawab("Kehadiran berhasil dicatat.", 200, { nama: k.nama });
}

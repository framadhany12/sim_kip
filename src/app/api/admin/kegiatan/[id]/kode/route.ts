import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ambilKegiatan, kodeSekarang, statusKegiatan } from "@/lib/kegiatan";

/** Kode QR yang sedang berlaku untuk satu kegiatan; dipanggil berkala oleh layar barcode admin. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const { id } = await params;
  const k = await ambilKegiatan(id);
  if (!k) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ...kodeSekarang(k.rahasia), status: statusKegiatan(k) }, { headers: { "Cache-Control": "no-store" } });
}

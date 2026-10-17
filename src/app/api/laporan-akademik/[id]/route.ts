import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { laporanAkademik, pendaftaran } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { bacaBerkas } from "@/lib/storage";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return new Response("Silakan masuk.", { status: 401 });
  const db = await getDb();
  const [row] = await db
    .select({ l: laporanAkademik, pemilik: pendaftaran.userId })
    .from(laporanAkademik)
    .innerJoin(pendaftaran, eq(pendaftaran.id, laporanAkademik.pendaftaranId))
    .where(eq(laporanAkademik.id, id));
  // Hanya pemilik laporan atau admin yang boleh melihat.
  if (!row || (user.role !== "admin" && row.pemilik !== user.id)) return new Response("Berkas tidak ditemukan.", { status: 404 });
  try {
    const data = await bacaBerkas(row.l.fileUrl);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": row.l.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(row.l.namaAsli)}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Berkas tidak ditemukan di penyimpanan.", { status: 404 });
  }
}

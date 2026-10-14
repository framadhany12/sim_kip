import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { berkas, pendaftaran } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { bacaBerkas } from "@/lib/storage";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return new Response("Silakan masuk.", { status: 401 });
  const db = await getDb();
  const [row] = await db
    .select({ b: berkas, pemilik: pendaftaran.userId })
    .from(berkas)
    .innerJoin(pendaftaran, eq(pendaftaran.id, berkas.pendaftaranId))
    .where(eq(berkas.id, id));
  // Hanya pemilik berkas atau admin yang boleh melihat.
  if (!row || (user.role !== "admin" && row.pemilik !== user.id)) return new Response("Berkas tidak ditemukan.", { status: 404 });
  try {
    const data = await bacaBerkas(row.b.fileUrl);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": row.b.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(row.b.namaAsli)}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Berkas tidak ditemukan di penyimpanan.", { status: 404 });
  }
}

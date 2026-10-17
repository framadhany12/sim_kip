import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { laporanAkademik } from "@/db/schema";
import { BannerPengumuman } from "@/components/pendaftar/banner-pengumuman";
import { FormLaporanIpk } from "@/components/pendaftar/form-laporan-ipk";
import { Card } from "@/components/ui";
import { tanggal } from "@/lib/constants";
import { konteksPendaftar } from "@/lib/konteks";
import { sudahMahasiswa } from "@/lib/pendaftaran";

export const metadata = { title: "Laporan IPK & Transkrip" };

export default async function LaporanIpkPage() {
  const { d } = await konteksPendaftar();
  if (!sudahMahasiswa(d)) redirect("/dashboard");
  const db = await getDb();
  const laporan = await db.select().from(laporanAkademik).where(eq(laporanAkademik.pendaftaranId, d.id)).orderBy(asc(laporanAkademik.semester));

  return (
    <div className="space-y-6">
      <Link href="/mahasiswa" className="text-sm font-medium text-slate-600 hover:text-slate-900">
        ← Kembali ke Mahasiswa
      </Link>
      <BannerPengumuman pendaftaranId={d.id} />
      <Card title="Laporkan IPK & Transkrip">
        <FormLaporanIpk />
      </Card>
      <Card title="Laporan terkirim">
        {laporan.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada laporan.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {laporan.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="font-semibold text-slate-900">Semester {l.semester}</span>
                <span className="tabular-nums text-slate-700">IPK {Number(l.ipk).toFixed(2).replace(".", ",")}</span>
                <span className="text-xs text-slate-500">{tanggal(l.updatedAt)}</span>
                <a href={`/api/laporan-akademik/${l.id}`} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline">
                  Lihat transkrip
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

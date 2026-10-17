import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { laporanAkademik } from "@/db/schema";
import { BannerPengumuman } from "@/components/pendaftar/banner-pengumuman";
import { FormLaporanIpk } from "@/components/pendaftar/form-laporan-ipk";
import { GrafikIpk } from "@/components/grafik-ipk";
import { ambilStatistikIpk } from "@/lib/statistik-ipk";
import { Card } from "@/components/ui";
import { tanggal } from "@/lib/constants";
import { konteksPendaftar } from "@/lib/konteks";
import { sudahMahasiswa } from "@/lib/pendaftaran";

export const metadata = { title: "Laporan IPK & Transkrip" };

export default async function LaporanIpkPage() {
  const { d } = await konteksPendaftar();
  if (!sudahMahasiswa(d)) redirect("/dashboard");
  const db = await getDb();
  // Tampilan mahasiswa: hanya rata-rata, kelompok kecil (< 3 mahasiswa) disembunyikan agar IPK individu tidak terbaca.
  const statistik = await ambilStatistikIpk(3);
  const angkatanSaya = String(new Date(d.user.createdAt.getTime() + 7 * 3600e3).getUTCFullYear());
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
      <section aria-labelledby="judul-grafik-ipk" className="space-y-3">
        <h2 id="judul-grafik-ipk" className="text-lg font-bold text-slate-900">
          Perbandingan IPK
        </h2>
        <GrafikIpk data={statistik} tandaiAngkatan={angkatanSaya} tandaiJurusan={d.jurusanDiterima ?? undefined} />
      </section>
    </div>
  );
}

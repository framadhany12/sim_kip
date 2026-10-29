import Link from "next/link";
import { GrafikMahasiswa } from "@/components/grafik-mahasiswa";
import { GrafikIpk } from "@/components/grafik-ipk";
import { Card, PageHeader, StatusMahasiswaBadge } from "@/components/ui";
import { STATUS_MAHASISWA, type StatusMahasiswa } from "@/db/schema";
import { STATUS_MAHASISWA_AKIBAT, STATUS_MAHASISWA_LABEL } from "@/lib/constants";
import { ambilStatistikIpk } from "@/lib/statistik-ipk";
import { ambilStatistikMahasiswa, type BarisKelompok } from "@/lib/statistik-mahasiswa";

export const metadata = { title: "Dashboard Mahasiswa" };
export const dynamic = "force-dynamic";

const ipk = (v: number | null) => (v == null ? "-" : v.toFixed(2).replace(".", ","));
const angka = (n: number) => n.toLocaleString("id-ID");
const persen = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "0%");

const TITIK: Record<StatusMahasiswa, string> = {
  aktif: "bg-emerald-500",
  dicabut: "bg-rose-500",
  tidak_aktif: "bg-amber-500",
  lulus: "bg-sky-500",
};

export default async function DashboardMahasiswaPage() {
  const [s, grafik] = await Promise.all([ambilStatistikMahasiswa(), ambilStatistikIpk(1)]);
  const t = s.total;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard Mahasiswa"
        desc="Ringkasan mahasiswa penerima KIP Kuliah: jumlah per status, per angkatan, per program studi, dan rata-rata IPK."
        action={
          <Link href="/admin/master-mahasiswa" className="text-sm font-semibold text-blue-700 hover:underline">
            Buka Master Mahasiswa →
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-sm font-medium text-slate-600">Total mahasiswa KIP-K</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{angka(t.total)}</p>
          <p className="mt-1 text-xs text-slate-500">
            NIM terisi {angka(s.nimTerisi)} dari {angka(t.total)}
          </p>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-sm font-medium text-slate-600">Mahasiswa aktif</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-700">{angka(t.aktif)}</p>
          <p className="mt-1 text-xs text-slate-500">{persen(t.aktif, t.total)} dari seluruh mahasiswa KIP-K</p>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2 sm:p-5 xl:col-span-1">
          <p className="text-sm font-medium text-slate-600">Rata-rata IPK</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-blue-800">{ipk(s.rataIpk)}</p>
          <p className="mt-1 text-xs text-slate-500">
            Dari {angka(s.melapor)} mahasiswa yang sudah melapor (IPK semester terakhir)
          </p>
        </section>
      </div>

      <Card title="Status mahasiswa">
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {STATUS_MAHASISWA.map((st) => (
            <li key={st} className="rounded-lg border border-slate-200 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <span aria-hidden className={`size-2.5 rounded-full ${TITIK[st]}`} />
                  {STATUS_MAHASISWA_LABEL[st]}
                </span>
                <span className="text-xs tabular-nums text-slate-500">{persen(t[st], t.total)}</span>
              </div>
              <p className="mt-1.5 text-2xl font-bold tabular-nums text-slate-900">{angka(t[st])}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                <div className={`h-full rounded-full ${TITIK[st]}`} style={{ width: persen(t[st], t.total) }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">{STATUS_MAHASISWA_AKIBAT[st]}</p>
              <Link href={`/admin/master-mahasiswa?status=${st}`} className="mt-1.5 inline-block text-xs font-semibold text-blue-700 hover:underline">
                Lihat daftar
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <GrafikMahasiswa total={t} angkatan={s.angkatan} jurusan={s.jurusan} />

      <TabelKelompok judul="Per angkatan" kolom="Angkatan" data={s.angkatan} tautan={(l) => `/admin/master-mahasiswa?tahun=${l}`} />
      <TabelKelompok judul="Per program studi" kolom="Program studi" data={s.jurusan} />

      <section aria-labelledby="judul-grafik" className="space-y-3">
        <h2 id="judul-grafik" className="text-lg font-bold text-slate-900">
          Grafik rata-rata IPK
        </h2>
        <GrafikIpk data={grafik} />
      </section>
    </div>
  );
}

function TabelKelompok({ judul, kolom, data, tautan }: { judul: string; kolom: string; data: BarisKelompok[]; tautan?: (label: string) => string }) {
  return (
    <Card title={judul}>
      {data.length === 0 ? (
        <p className="text-sm text-slate-500">Belum ada mahasiswa.</p>
      ) : (
        <div className="-mx-4 overflow-x-auto sm:-mx-5">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2 font-semibold sm:px-5">{kolom}</th>
                {STATUS_MAHASISWA.map((st) => (
                  <th key={st} className="px-3 py-2 text-right font-semibold">
                    <StatusMahasiswaBadge status={st} />
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-semibold">Total</th>
                <th className="px-4 py-2 text-right font-semibold sm:px-5">Rata-rata IPK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((b) => (
                <tr key={b.label} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-900 sm:px-5">
                    {tautan ? (
                      <Link href={tautan(b.label)} className="hover:text-blue-700 hover:underline">
                        {b.label}
                      </Link>
                    ) : (
                      b.label
                    )}
                  </td>
                  {STATUS_MAHASISWA.map((st) => (
                    <td key={st} className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                      {angka(b[st])}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">{angka(b.total)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700 sm:px-5" title={`${b.melapor} mahasiswa melapor`}>
                    {ipk(b.rataIpk)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

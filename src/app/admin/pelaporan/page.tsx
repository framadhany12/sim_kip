import Link from "next/link";
import { Download } from "lucide-react";
import { tutupPengumumanMahasiswa } from "@/app/actions/pelaporan";
import { FormUmumkan } from "@/components/admin/form-umumkan";
import { GrafikIpk } from "@/components/grafik-ipk";
import { ambilStatistikIpk } from "@/lib/statistik-ipk";
import { Card, PageHeader } from "@/components/ui";
import { daftarTahun } from "@/lib/admin-query";
import { tanggal } from "@/lib/constants";
import {
  daftarBelumMelapor,
  daftarJurusanFilter,
  daftarMahasiswaMelapor,
  ringkasSemester,
  daftarPengumumanMahasiswa,
  PER_HALAMAN_LAPORAN,
  type FilterPelaporan,
} from "@/lib/pelaporan-akademik";
import { inputCls } from "@/lib/styles";

export const metadata = { title: "Pelaporan IPK & Transkrip" };

type Params = FilterPelaporan & { tab?: string };
const TAB = [
  ["laporan", "Laporan masuk"],
  ["belum", "Belum melapor"],
  ["grafik", "Grafik IPK"],
  ["umumkan", "Umumkan"],
] as const;

const tglPendek = (s: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${s}T00:00:00Z`));

export default async function PelaporanPage({ searchParams }: { searchParams: Promise<Params> }) {
  const f = await searchParams;
  const tab = TAB.some(([k]) => k === f.tab) ? (f.tab as (typeof TAB)[number][0]) : "laporan";
  const qs = (extra: Record<string, string | number>) =>
    new URLSearchParams(Object.entries({ ...f, ...extra }).filter(([, v]) => v !== undefined && v !== "") as [string, string][]).toString();
  const qsFilter = new URLSearchParams(Object.entries({ ...f, tab, page: "" }).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <div className="space-y-5">
      <PageHeader title="Pelaporan IPK & Transkrip" desc="Pantau IPK dan transkrip nilai yang dilaporkan mahasiswa, lihat siapa yang belum melapor, dan umumkan kewajiban lapor ke semua mahasiswa." />
      <nav className="flex gap-1 border-b border-slate-200" aria-label="Bagian pelaporan">
        {TAB.map(([k, label]) => (
          <Link
            key={k}
            href={`?tab=${k}`}
            aria-current={tab === k ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === k ? "border-blue-700 text-blue-800" : "border-transparent text-slate-600 hover:text-slate-900"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {tab === "umumkan" ? <Umumkan /> : tab === "grafik" ? <Grafik /> : <Daftar tab={tab} f={f} qs={qs} qsFilter={qsFilter} />}
    </div>
  );
}

async function Grafik() {
  const data = await ambilStatistikIpk(1);
  return <GrafikIpk data={data} />;
}

async function Umumkan() {
  const daftar = await daftarPengumumanMahasiswa();
  return (
    <div className="space-y-5">
      <Card title="Buat pengumuman untuk mahasiswa">
        <FormUmumkan />
      </Card>
      <Card title="Pengumuman sebelumnya">
        {daftar.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada pengumuman.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {daftar.map((p) => (
              <li key={p.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {p.judul} {!p.aktif && <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Ditutup</span>}
                  </p>
                  <p className="mt-0.5 whitespace-pre-line text-sm text-slate-600">{p.isi}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {tanggal(p.createdAt)}
                    {p.semester && <> · Semester {p.semester}</>}
                    {p.tenggat && <> · Batas {tglPendek(p.tenggat)}</>}
                    {p.belum !== null && (
                      <>
                        {" "}
                        ·{" "}
                        <Link href={`?tab=belum&semester=${p.semester}`} className="font-semibold text-blue-700 hover:underline">
                          {p.belum} belum melapor
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                {p.aktif && (
                  <form action={tutupPengumumanMahasiswa.bind(null, p.id)}>
                    <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">Tutup</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

async function Daftar({ tab, f, qs, qsFilter }: { tab: "laporan" | "belum"; f: Params; qs: (e: Record<string, string | number>) => string; qsFilter: string }) {
  const [pilihanTahun, daftarJurusan] = await Promise.all([daftarTahun(), daftarJurusanFilter()]);
  const belum = tab === "belum";
  const hasil = belum ? await daftarBelumMelapor(f) : await daftarMahasiswaMelapor(f);
  const { total, halaman } = hasil;
  const jumlahHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN_LAPORAN));
  const semesterAktif = belum ? (hasil as Awaited<ReturnType<typeof daftarBelumMelapor>>).semester : undefined;

  return (
    <>
      <Card>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1.4fr_1fr_1fr_auto]">
          <input type="hidden" name="tab" value={tab} />
          <div>
            <label htmlFor="q" className="mb-1 block text-xs font-medium text-slate-600">
              Cari nama, NIM, atau kelas
            </label>
            <input id="q" name="q" defaultValue={f.q} className={inputCls} />
          </div>
          <div>
            <label htmlFor="jurusan" className="mb-1 block text-xs font-medium text-slate-600">
              Jurusan
            </label>
            <select id="jurusan" name="jurusan" defaultValue={f.jurusan ?? ""} className={inputCls}>
              <option value="">Semua jurusan</option>
              {daftarJurusan.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="angkatan" className="mb-1 block text-xs font-medium text-slate-600">
              Angkatan
            </label>
            <select id="angkatan" name="angkatan" defaultValue={f.angkatan ?? ""} className={inputCls}>
              <option value="">Semua angkatan</option>
              {pilihanTahun.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="semester" className="mb-1 block text-xs font-medium text-slate-600">
              Semester
            </label>
            <select id="semester" name="semester" defaultValue={belum ? String(semesterAktif) : (f.semester ?? "")} className={inputCls}>
              {!belum && <option value="">Semua</option>}
              {Array.from({ length: 14 }, (_, i) => i + 1).map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Terapkan</button>
            <Link href={`?tab=${tab}`} className="rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100">
              Reset
            </Link>
          </div>
        </form>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {belum ? (
            <>
              <b>{total}</b> mahasiswa belum melaporkan IPK <b>Semester {semesterAktif}</b>.
            </>
          ) : (
            <>
              <b>{total}</b> mahasiswa sudah melapor. Klik nama untuk melihat IPK per semester.
            </>
          )}
        </p>
        <a
          href={`/api/admin/export-ipk?${qsFilter}${belum ? `&semester=${semesterAktif}` : ""}`}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <Download className="size-4" aria-hidden /> Export Excel{belum ? ` (${total})` : ""}
        </a>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {belum ? (
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Mahasiswa</th>
                <th className="px-4 py-3 font-semibold">NIM / Kelas</th>
                <th className="px-4 py-3 font-semibold">Jurusan</th>
                <th className="px-4 py-3 font-semibold">Angkatan</th>
                <th className="px-4 py-3 font-semibold">Kontak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hasil.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    Semua mahasiswa pada filter ini sudah melaporkan Semester {semesterAktif}.
                  </td>
                </tr>
              )}
              {(hasil.rows as Awaited<ReturnType<typeof daftarBelumMelapor>>["rows"]).map((r) => (
                <tr key={r.id} className="align-top hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {r.nama}
                    <span className="block break-all text-xs font-normal text-slate-500">{r.email}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] text-slate-700">
                    {r.nim ?? "—"}
                    <span className="block font-sans text-slate-500">{r.kelas ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.jurusan ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{r.angkatan}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-slate-700">{r.kontak ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Mahasiswa</th>
                <th className="px-4 py-3 font-semibold">NIM / Kelas</th>
                <th className="px-4 py-3 font-semibold">Jurusan</th>
                <th className="px-4 py-3 font-semibold">Angkatan</th>
                <th className="px-4 py-3 font-semibold">Laporan masuk</th>
                <th className="px-4 py-3 font-semibold">Terakhir melapor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hasil.rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Belum ada mahasiswa yang melapor sesuai filter.
                  </td>
                </tr>
              )}
              {(hasil.rows as Awaited<ReturnType<typeof daftarMahasiswaMelapor>>["rows"]).map((r) => (
                <tr key={r.id} className="align-top hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/pelaporan/${r.id}`} className="font-semibold text-blue-700 hover:underline">
                      {r.nama}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] text-slate-700">
                    {r.nim ?? "—"}
                    <span className="block font-sans text-slate-500">{r.kelas ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.jurusan ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{r.angkatan}</td>
                  <td className="px-4 py-3 text-slate-700">{ringkasSemester(r.semesterDilaporkan)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{tanggal(new Date(r.terakhir))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {jumlahHalaman > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Halaman">
          <span className="text-slate-600">
            Halaman {halaman} dari {jumlahHalaman}
          </span>
          <span className="flex gap-2">
            {halaman > 1 && (
              <Link href={`?${qs({ tab, page: halaman - 1 })}`} className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-300 hover:bg-slate-50">
                ← Sebelumnya
              </Link>
            )}
            {halaman < jumlahHalaman && (
              <Link href={`?${qs({ tab, page: halaman + 1 })}`} className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-300 hover:bg-slate-50">
                Berikutnya →
              </Link>
            )}
          </span>
        </nav>
      )}
    </>
  );
}

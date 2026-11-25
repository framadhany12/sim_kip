import { Download } from "lucide-react";
import { FormFilter } from "@/components/form-filter";
import Link from "next/link";
import { tutupPengumumanMahasiswa } from "@/app/actions/pelaporan";
import { FormUmumkanBukuTabungan } from "@/components/admin/form-umumkan-buku-tabungan";
import { TombolHapusBukuTabungan } from "@/components/admin/tombol-hapus-buku-tabungan";
import { Card, PageHeader } from "@/components/ui";
import { daftarAngkatan } from "@/lib/angkatan";
import { ANGKATAN_BUKU_TABUNGAN, belumPerAngkatan, daftarBukuTabungan, daftarPengumumanBukuTabungan, PER_HALAMAN_BT, ringkasanBukuTabungan, type FilterBukuTabungan } from "@/lib/buku-tabungan";
import { tanggal, tanggalPanjang } from "@/lib/constants";
import { daftarJurusanFilter } from "@/lib/pelaporan-akademik";
import { inputCls } from "@/lib/styles";

export const metadata = { title: "Buku Tabungan" };

type Params = FilterBukuTabungan & { tab?: string };
const TAB = [
  ["sudah", "Sudah mengisi"],
  ["belum", "Belum mengisi"],
  ["umumkan", "Umumkan"],
] as const;
type Tab = (typeof TAB)[number][0];

export default async function BukuTabunganAdminPage({ searchParams }: { searchParams: Promise<Params> }) {
  const f = await searchParams;
  const tab: Tab = TAB.find(([k]) => k === f.tab)?.[0] ?? "sudah";
  const ringkas = await ringkasanBukuTabungan();
  const jumlah: Record<Tab, number | null> = {
    sudah: ringkas.sudah,
    belum: ringkas.belum,
    umumkan: null,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Buku Tabungan"
        desc={`Nomor rekening KIP-K dan buku tabungan mahasiswa angkatan ${ANGKATAN_BUKU_TABUNGAN} ke atas. Hapus kiriman yang keliru agar mahasiswa bisa mengirim ulang.`}
      />
      <nav className="flex gap-1 overflow-x-auto border-b border-slate-200" aria-label="Bagian buku tabungan">
        {TAB.map(([k, label]) => (
          <Link
            key={k}
            href={`?tab=${k}`}
            aria-current={tab === k ? "page" : undefined}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === k ? "border-blue-700 text-blue-800" : "border-transparent text-slate-600 hover:text-slate-900"}`}
          >
            {label}
            {jumlah[k] !== null && <span className="rounded-full bg-slate-100 px-2 py-px text-xs tabular-nums text-slate-700">{jumlah[k]}</span>}
          </Link>
        ))}
      </nav>
      {tab === "umumkan" ? <Umumkan /> : <Daftar tab={tab} f={f} />}
    </div>
  );
}

async function Umumkan() {
  const [daftar, pilihan] = await Promise.all([daftarPengumumanBukuTabungan(), belumPerAngkatan()]);
  return (
    <div className="space-y-5">
      <Card title="Umumkan ke yang belum mengisi">
        <FormUmumkanBukuTabungan pilihan={pilihan} />
      </Card>
      <Card title="Pengumuman sebelumnya">
        {daftar.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada pengumuman buku tabungan.</p>
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
                    {tanggal(p.createdAt)} · {p.angkatanSasaran ? `Angkatan ${p.angkatanSasaran.split(",").join(", ")}` : "Semua angkatan"}
                    {p.tenggat && <> · Batas {tanggalPanjang(p.tenggat)}</>}
                  </p>
                </div>
                {p.aktif && (
                  <form action={tutupPengumumanMahasiswa.bind(null, p.id)}>
                    <button className="min-h-9 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">Tutup</button>
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

async function Daftar({ tab, f }: { tab: "sudah" | "belum"; f: Params }) {
  const [pilihanTahun, daftarJurusan, { rows, total, halaman }] = await Promise.all([daftarAngkatan(), daftarJurusanFilter(), daftarBukuTabungan(tab, f)]);
  const jumlahHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN_BT));
  const qs = (extra: Record<string, string | number>) => new URLSearchParams(Object.entries({ ...f, tab, ...extra }).filter(([, v]) => v !== undefined && v !== "") as [string, string][]).toString();
  const sudah = tab === "sudah";
  const kosong = Object.values({
    q: f.q,
    jurusan: f.jurusan,
    angkatan: f.angkatan,
  }).some(Boolean)
    ? "Tidak ada mahasiswa yang cocok dengan filter."
    : sudah
      ? "Belum ada mahasiswa yang mengirim buku tabungan."
      : "Semua mahasiswa aktif sudah mengirim buku tabungan.";

  return (
    <>
      <Card>
        <FormFilter className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1.4fr_1fr_auto]">
          <input type="hidden" name="tab" value={tab} />
          <div>
            <label htmlFor="q" className="mb-1 block text-xs font-medium text-slate-600">
              Cari nama, NIM{sudah ? ", atau No. Rek" : ""}
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
              {pilihanTahun
                .filter((t) => t >= ANGKATAN_BUKU_TABUNGAN)
                .map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Link href={`?tab=${tab}`} className="inline-flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100">
              Reset
            </Link>
          </div>
        </FormFilter>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {sudah ? (
            <>
              <b>{total}</b> mahasiswa sudah mengirim.
            </>
          ) : (
            <>
              <b>{total}</b> mahasiswa aktif belum mengirim. Yang lulus, dicabut KIP-K, atau tidak aktif tidak dihitung.{" "}
              {total > 0 && (
                <Link href="?tab=umumkan" className="font-semibold text-blue-700 hover:underline">
                  Umumkan ke mereka
                </Link>
              )}
            </>
          )}
        </p>
        {sudah && total > 0 && (
          <span className="flex gap-2">
            {(
              [
                ["xlsx", "Export Excel"],
                ["docx", "Export Word"],
              ] as const
            ).map(([format, label]) => (
              <a
                key={format}
                href={`/api/admin/export-buku-tabungan?${new URLSearchParams(Object.entries({ q: f.q, jurusan: f.jurusan, angkatan: f.angkatan, format }).filter(([, v]) => v) as [string, string][])}`}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
              >
                <Download className="size-4" aria-hidden />
                {label}
              </a>
            ))}
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Mahasiswa</th>
              <th className="px-4 py-3 font-semibold">NIM / Kelas</th>
              <th className="px-4 py-3 font-semibold">Jurusan</th>
              <th className="px-4 py-3 font-semibold">Angkatan</th>
              {sudah ? (
                <>
                  <th className="px-4 py-3 font-semibold">No. Rekening KIP-K</th>
                  <th className="px-4 py-3 font-semibold">Buku tabungan</th>
                  <th className="px-4 py-3 font-semibold">Dikirim</th>
                  <th className="px-4 py-3 font-semibold">
                    <span className="sr-only">Aksi</span>
                  </th>
                </>
              ) : (
                <th className="px-4 py-3 font-semibold">Kontak</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={sudah ? 8 : 5} className="px-4 py-10 text-center text-slate-500">
                  {kosong}
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="align-top hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {r.nama}
                  <span className="block break-all text-xs font-normal text-slate-500">{r.email}</span>
                </td>
                <td className="px-4 py-3 font-mono text-[13px] text-slate-700">
                  {r.nim ?? "-"}
                  <span className="block font-sans text-slate-500">{r.kelas ?? "-"}</span>
                </td>
                <td className="px-4 py-3 text-slate-700">{r.jurusan ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{r.angkatan}</td>
                {sudah ? (
                  <>
                    <td className="px-4 py-3 font-mono text-[13px] font-semibold text-slate-900">{r.noRekening}</td>
                    <td className="px-4 py-3">
                      <a href={`/api/buku-tabungan/${r.btId}`} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline">
                        Lihat {r.mimeType === "application/pdf" ? "PDF" : "foto"}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{r.dikirim ? tanggal(r.dikirim) : "-"}</td>
                    <td className="px-4 py-3 text-right">{r.btId && <TombolHapusBukuTabungan id={r.btId} nama={r.nama} />}</td>
                  </>
                ) : (
                  <td className="px-4 py-3 font-mono text-[13px] text-slate-700">{r.kontak ?? "-"}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {jumlahHalaman > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Halaman">
          <span className="text-slate-600">
            Halaman {halaman} dari {jumlahHalaman}
          </span>
          <span className="flex gap-2">
            {halaman > 1 && (
              <Link href={`?${qs({ page: halaman - 1 })}`} className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-300 hover:bg-slate-50">
                Sebelumnya
              </Link>
            )}
            {halaman < jumlahHalaman && (
              <Link href={`?${qs({ page: halaman + 1 })}`} className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-300 hover:bg-slate-50">
                Berikutnya
              </Link>
            )}
          </span>
        </nav>
      )}
    </>
  );
}

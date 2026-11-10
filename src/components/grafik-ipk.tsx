import type { StatistikIpk, TitikIpk } from "@/lib/statistik-ipk";

const ipk = (v: number) => v.toFixed(2).replace(".", ",");
const SKALA = [0, 1, 2, 3, 4];
const KOLOM = "sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_5.5rem]";

/** Satu grafik batang horizontal (nilai IPK 0–4, dasar batang di nol). Tanpa JavaScript: server component. */
function Batang({ judul, kolom, sub, data, tandai }: { judul: string; kolom: string; sub: string; data: TitikIpk[]; tandai?: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5" aria-label={judul}>
      <h3 className="text-[15px] font-semibold text-slate-900">{judul}</h3>
      <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
      {data.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Belum ada data yang cukup untuk ditampilkan.</p>
      ) : (
        <>
          <div className={`mt-4 hidden grid-cols-1 gap-x-3 text-[11px] text-slate-500 sm:grid ${KOLOM}`} aria-hidden>
            <span />
            <span className="relative h-4">
              {SKALA.map((s) => (
                <span key={s} className="absolute -translate-x-1/2 tabular-nums" style={{ left: `${(s / 4) * 100}%` }}>
                  {s}
                </span>
              ))}
            </span>
            <span />
          </div>
          <ul className="mt-1 space-y-1.5">
            {data.map((t) => {
              const milik = !!tandai && t.label === tandai;
              const berwarna = !tandai || milik;
              return (
                <li
                  key={t.label}
                  title={`${t.label}: rata-rata IPK ${ipk(t.rata)} dari ${t.n} mahasiswa`}
                  aria-label={`${t.label}: rata-rata IPK ${ipk(t.rata)} dari ${t.n} mahasiswa${milik ? " (kelompok Anda)" : ""}`}
                  className={`grid grid-cols-1 items-center gap-x-3 gap-y-1 rounded-md px-1 py-1 transition-colors hover:bg-slate-50 ${KOLOM}`}
                >
                  <span className={`text-[13px] leading-snug ${milik ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                    {t.label}
                    {milik && <span className="ml-1.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 ring-1 ring-inset ring-blue-200">Anda</span>}
                  </span>
                  <span
                    className="relative h-3.5"
                    style={{ backgroundImage: "linear-gradient(to right, var(--grafik-grid) 1px, transparent 1px)", backgroundSize: "25% 100%", borderRight: "1px solid var(--grafik-grid)" }}
                    aria-hidden
                  >
                    <span className="bar-tumbuh absolute inset-y-0 left-0 rounded-r-[4px]" style={{ width: `${Math.min(100, (t.rata / 4) * 100)}%`, background: berwarna ? "var(--grafik-bar)" : "var(--grafik-bar-redup)" }} />
                  </span>
                  <span className="text-[13px] tabular-nums text-slate-900">
                    <b>{ipk(t.rata)}</b>
                    <span className="ml-1.5 text-xs text-slate-500">n={t.n}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-xs font-semibold text-blue-700 hover:underline">Lihat sebagai tabel</summary>
            <table className="mt-2 w-full text-left text-xs">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-1 pr-3 font-semibold">{kolom}</th>
                  <th className="py-1 pr-3 font-semibold">Rata-rata IPK</th>
                  <th className="py-1 font-semibold">Jumlah mahasiswa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {data.map((t) => (
                  <tr key={t.label}>
                    <td className="py-1 pr-3">{t.label}</td>
                    <td className="py-1 pr-3 tabular-nums">{ipk(t.rata)}</td>
                    <td className="py-1 tabular-nums">{t.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </section>
  );
}

/**
 * Grafik rata-rata IPK per angkatan dan per jurusan. `tandaiAngkatan`/`tandaiJurusan` menyorot kelompok milik mahasiswa
 * yang sedang melihat (yang lain diredam ke abu-abu); kosong = semua batang berwarna sama (tampilan admin).
 */
export function GrafikIpk({ data, tandaiAngkatan, tandaiJurusan }: { data: StatistikIpk; tandaiAngkatan?: string; tandaiJurusan?: string }) {
  return (
    <div className="space-y-4">
      {data.keseluruhan && (
        <div className="inline-flex flex-col rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="text-xs font-medium text-slate-500">Rata-rata IPK seluruh mahasiswa</span>
          <span className="text-4xl font-bold tabular-nums text-slate-900">{ipk(data.keseluruhan.rata)}</span>
          <span className="text-xs text-slate-500">dari {data.keseluruhan.n} mahasiswa yang sudah melapor (IPK semester terakhir masing-masing)</span>
        </div>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        <Batang judul="Rata-rata IPK per angkatan" kolom="Angkatan" sub="Angkatan = tahun mendaftar. Skala 0–4." data={data.angkatan} tandai={tandaiAngkatan} />
        <Batang judul="Rata-rata IPK per jurusan" kolom="Jurusan" sub="Jurusan tempat diterima, urut dari tertinggi. Skala 0–4." data={data.jurusan} tandai={tandaiJurusan} />
      </div>
      {data.minimalN > 1 && (
        <p className="text-xs text-slate-500">
          Demi privasi, kelompok dengan kurang dari {data.minimalN} mahasiswa tidak ditampilkan
          {data.disembunyikan > 0 ? ` (${data.disembunyikan} kelompok disembunyikan)` : ""}. Yang ditampilkan hanya rata-rata, bukan data individu.
        </p>
      )}
    </div>
  );
}

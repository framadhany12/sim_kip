import Link from "next/link";
import { asc, count, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { jurusan, pendaftaran, pertanyaan, pilihanJurusan, rekomendasi, STATUS, sumberRekomendasi, type Status } from "@/db/schema";
import { Card, PageHeader, StatusBadge } from "@/components/ui";
import { tanggal } from "@/lib/constants";
import { cariPendaftar, daftarGelombang } from "@/lib/admin-query";
import { GELOMBANG_AKTIF } from "@/lib/pendaftaran";

export const metadata = { title: "Ringkasan Admin" };

function Bars({ title, rows }: { title: string; rows: { nama: string; n: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li key={r.nama} title={`${r.nama}: ${r.n} pendaftar`} className="grid grid-cols-[1fr_2.5rem] items-center gap-x-3 gap-y-1 text-sm">
            <span className="col-span-2 text-slate-700">{r.nama}</span>
            <span className="h-2.5 rounded-r bg-slate-100">
              <span className="block h-full rounded-r-[4px] bg-blue-700" style={{ width: `${(r.n / max) * 100}%` }} />
            </span>
            <span className="text-right font-semibold tabular-nums text-slate-900">{r.n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ gelombang?: string }> }) {
  const { gelombang: g } = await searchParams;
  const gelombang = g ?? GELOMBANG_AKTIF;
  const db = await getDb();
  const filterG = gelombang === "semua" ? undefined : eq(pendaftaran.gelombang, gelombang);

  const perStatus = await db.select({ status: pendaftaran.status, n: count() }).from(pendaftaran).where(filterG).groupBy(pendaftaran.status);
  const n = Object.fromEntries(STATUS.map((s) => [s, perStatus.find((r) => r.status === s)?.n ?? 0])) as Record<Status, number>;
  const menunggu = n.terkirim + n.diperiksa;
  const selesai = n.diterima + n.ditolak;
  const masuk = menunggu + selesai + n.perbaikan;

  const statJurusan = async (kolom: typeof pilihanJurusan.jurusan1Id | typeof pilihanJurusan.jurusan2Id) =>
    db
      .select({ nama: jurusan.nama, n: sql<number>`count(${pendaftaran.id})` })
      .from(jurusan)
      .leftJoin(pilihanJurusan, eq(kolom, jurusan.id))
      .leftJoin(pendaftaran, sql`${pendaftaran.id} = ${pilihanJurusan.pendaftaranId} and ${pendaftaran.status} != 'draft'${gelombang === "semua" ? sql`` : sql` and ${pendaftaran.gelombang} = ${gelombang}`}`)
      .groupBy(jurusan.id, jurusan.nama)
      .orderBy(asc(jurusan.nama));
  const statRekomendasi = db
    .select({ nama: sumberRekomendasi.nama, n: sql<number>`count(${pendaftaran.id})` })
    .from(sumberRekomendasi)
    .leftJoin(rekomendasi, eq(rekomendasi.sumberId, sumberRekomendasi.id))
    .leftJoin(pendaftaran, sql`${pendaftaran.id} = ${rekomendasi.pendaftaranId} and ${pendaftaran.status} != 'draft'${gelombang === "semua" ? sql`` : sql` and ${pendaftaran.gelombang} = ${gelombang}`}`)
    .groupBy(sumberRekomendasi.id, sumberRekomendasi.nama, sumberRekomendasi.urutan)
    .orderBy(asc(sumberRekomendasi.urutan), asc(sumberRekomendasi.nama));
  const [p1, p2, gelombangList, terbaru, [{ belumDijawab }], perSumber] = await Promise.all([
    statJurusan(pilihanJurusan.jurusan1Id),
    statJurusan(pilihanJurusan.jurusan2Id),
    daftarGelombang(),
    cariPendaftar({ status: "masuk", gelombang: gelombang === "semua" ? undefined : gelombang }),
    db.select({ belumDijawab: count() }).from(pertanyaan).where(sql`${pertanyaan.jawaban} is null`),
    statRekomendasi,
  ]);

  const pct = masuk ? Math.round((selesai / masuk) * 100) : 0;
  const pilihanG = [...new Set([GELOMBANG_AKTIF, ...gelombangList])];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ringkasan Pendaftaran"
        desc="Pantau progres verifikasi dan sebaran pilihan jurusan."
        action={
          <form className="flex items-center gap-2">
            <label htmlFor="gelombang" className="text-sm text-slate-600">
              Gelombang
            </label>
            <select id="gelombang" name="gelombang" defaultValue={gelombang} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              {pilihanG.map((x) => (
                <option key={x}>{x}</option>
              ))}
              <option value="semua">Semua gelombang</option>
            </select>
            <button className="rounded-lg bg-white px-3 py-2 text-sm font-medium ring-1 ring-slate-300 hover:bg-slate-50">Terapkan</button>
          </form>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Pendaftaran masuk", masuk, "Sudah dikirim pendaftar", "/admin/pendaftar?status=semua"],
          ["Menunggu diperiksa", menunggu, "Perlu tindakan admin", "/admin/pendaftar?status=masuk"],
          ["Perlu perbaikan", n.perbaikan, "Menunggu pendaftar", "/admin/pendaftar?status=perbaikan"],
          ["Akun belum kirim", n.draft, "Masih mengisi formulir", "/admin/pendaftar?status=draft"],
        ].map(([label, val, sub, href]) => (
          <Link key={label as string} href={href as string} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300">
            <p className="text-sm text-slate-600">{label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{val}</p>
            <p className="text-xs text-slate-500">{sub}</p>
          </Link>
        ))}
      </div>

      <Card title="Progres verifikasi">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-slate-600">
            <b className="text-slate-900">{selesai}</b> dari {masuk} pendaftaran sudah diputuskan ({n.diterima} diterima, {n.ditolak} tidak diterima)
          </p>
          <p className="text-2xl font-bold tabular-nums">{pct}%</p>
        </div>
        <div className="mt-2 flex h-3 gap-0.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${pct}% selesai diverifikasi`}>
          <span className="h-full bg-blue-700" style={{ width: `${pct}%` }} />
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {STATUS.filter((s) => s !== "draft").map((s) => (
            <li key={s} className="flex items-center gap-2">
              <StatusBadge status={s} /> <span className="font-semibold tabular-nums">{n[s]}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card title="Pendaftar per pilihan jurusan" action={<span className="text-xs text-slate-500">Hanya yang sudah dikirim</span>}>
          <div className="grid gap-6 md:grid-cols-2">
            <Bars title="Jurusan 1" rows={p1} />
            <Bars title="Jurusan 2" rows={p2} />
          </div>
          {perSumber.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <Bars title="Sumber rekomendasi" rows={perSumber} />
            </div>
          )}
        </Card>
        <Card
          title="Menunggu diperiksa"
          action={
            <Link href="/admin/pendaftar" className="text-sm font-medium text-blue-700 hover:underline">
              Semua →
            </Link>
          }
        >
          {terbaru.rows.length === 0 ? (
            <p className="text-sm text-slate-500">Tidak ada pendaftaran yang menunggu. 🎉</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {terbaru.rows.slice(0, 6).map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/pendaftar/${r.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-50">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">{r.nama ?? r.akunNama}</span>
                      <span className="block text-xs text-slate-500">{tanggal(r.submittedAt)}</span>
                    </span>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {belumDijawab > 0 && (
            <Link href="/admin/pertanyaan" className="mt-4 block rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100">
              {belumDijawab} pertanyaan pendaftar belum dijawab →
            </Link>
          )}
        </Card>
      </div>
    </div>
  );
}

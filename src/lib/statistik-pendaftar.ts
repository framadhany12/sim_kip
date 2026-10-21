import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { rentangTahun, tahunBerjalan } from "./tahun";

/** Statistik agregat (tanpa data pribadi) yang boleh dilihat calon mahasiswa di dashboard mereka. */
export type StatistikPendaftar = Awaited<ReturnType<typeof hitung>>;

/** Pendaftaran tahun berjalan yang sudah dikirim: jumlah, hasil, dan peminat tiap jurusan. */
export function ambilStatistikPendaftar() {
  // Angkanya sama untuk semua pendaftar, jadi dihitung sekali per menit.
  if (!cache || cache.sampai <= Date.now()) {
    const nilai = hitung();
    cache = { sampai: Date.now() + 60_000, nilai };
    nilai.catch(() => (cache = undefined));
  }
  return cache.nilai;
}

let cache: { sampai: number; nilai: ReturnType<typeof hitung> } | undefined;

async function hitung() {
  const db = await getDb();
  const tahun = tahunBerjalan();
  const { dari, sampai } = rentangTahun(tahun);
  const pemilik = sql`select u2.id from users u2 where u2.mahasiswa_lama = 0 and u2.created_at >= ${dari} and u2.created_at < ${sampai}`;
  const dikirim = sql`p.status not in ('draft','perbaikan') and p.user_id in (${pemilik})`;

  type Baris = Record<string, unknown>;
  const q = async <T extends Baris>(s: ReturnType<typeof sql>) => ((await db.execute(s)) as unknown as [T[]])[0];

  const totP = q<{ total: number; diterima: number; ditolak: number; proses: number }>(sql`
    select count(*) total,
           coalesce(sum(p.status = 'diterima'), 0) diterima,
           coalesce(sum(p.status = 'ditolak'), 0) ditolak,
           coalesce(sum(p.status in ('terkirim','diperiksa')), 0) proses
    from pendaftaran p where ${dikirim}`);

  const jurusanP = q<{ nama: string; p1: number; p2: number; diterima: number }>(sql`
    select j.nama,
      (select count(*) from pilihan_jurusan pj join pendaftaran p on p.id = pj.pendaftaran_id
        where pj.jurusan_1_id = j.id and ${dikirim}) p1,
      (select count(*) from pilihan_jurusan pj join pendaftaran p on p.id = pj.pendaftaran_id
        where pj.jurusan_2_id = j.id and ${dikirim}) p2,
      (select count(*) from pendaftaran p where p.jurusan_diterima_id = j.id and p.hasil = 'diterima' and ${dikirim}) diterima
    from jurusan j where j.aktif = 1 order by j.nama`);

  const [[tot], jurusan] = await Promise.all([totP, jurusanP]);

  return {
    tahun,
    total: Number(tot?.total ?? 0),
    diterima: Number(tot?.diterima ?? 0),
    ditolak: Number(tot?.ditolak ?? 0),
    proses: Number(tot?.proses ?? 0),
    jurusan: jurusan.map((r) => ({ nama: r.nama, p1: Number(r.p1), p2: Number(r.p2), diterima: Number(r.diterima) })),
  };
}

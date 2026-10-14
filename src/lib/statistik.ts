import "server-only";
import { and, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { dataDiri, pendaftaran, pertanyaan, riwayatStatus, TAHAP, users, type Status } from "@/db/schema";
import { DESIL_LABEL, TAHAP_LABEL, labelRiwayat } from "./constants";

/** Ringkasan untuk dashboard admin. Semua nilai JSON-safe (tanggal sebagai string ISO). */
export type Statistik = Awaited<ReturnType<typeof ambilStatistik>>;

const WIB_MS = 7 * 3600e3;
/** "YYYY-MM-DD" menurut WIB untuk sebuah waktu. */
const tglWib = (d: Date) => new Date(d.getTime() + WIB_MS).toISOString().slice(0, 10);

type Baris = Record<string, unknown>;
async function rows<T extends Baris>(q: SQL): Promise<T[]> {
  const db = await getDb();
  const [r] = (await db.execute(q)) as unknown as [T[]];
  return r;
}

export async function ambilStatistik({ gelombang, hari = 30 }: { gelombang?: string; hari?: number }) {
  const db = await getDb();
  const sekarang = new Date();
  const hariIni = tglWib(sekarang);
  const awalRentang = new Date(Date.parse(`${hariIni}T00:00:00+07:00`) - (hari - 1) * 864e5);
  const fG = gelombang ? eq(pendaftaran.gelombang, gelombang) : undefined;
  const gSql = gelombang ? sql` and p.gelombang = ${gelombang}` : sql``;
  const dikirim = sql`p.status not in ('draft','perbaikan')`;

  // --- Angka utama -----------------------------------------------------------
  const perStatus = await db.select({ status: pendaftaran.status, n: sql<number>`count(*)` }).from(pendaftaran).where(fG).groupBy(pendaftaran.status);
  const n = (s: Status[]) => perStatus.filter((r) => s.includes(r.status)).reduce((a, r) => a + Number(r.n), 0);
  const [{ gugurAdm }] = await db
    .select({ gugurAdm: sql<number>`count(*)` })
    .from(pendaftaran)
    .where(and(fG, eq(pendaftaran.status, "ditolak"), eq(pendaftaran.tahap, "administrasi")));
  const [akun] = await rows<{ total: number; terverifikasi: number; hariIni: number }>(sql`
    select count(*) total,
           sum(email_verified_at is not null) terverifikasi,
           sum(date_format(date_add(created_at, interval 7 hour), '%Y-%m-%d') = ${hariIni}) hariIni
    from users where role = 'pendaftar'`);
  const [kirimHariIni] = await rows<{ n: number }>(sql`
    select count(*) n from pendaftaran p
    where p.submitted_at is not null and date_format(date_add(p.submitted_at, interval 7 hour), '%Y-%m-%d') = ${hariIni} ${gSql}`);
  const [{ belumDijawab }] = await db.select({ belumDijawab: sql<number>`count(*)` }).from(pertanyaan).where(sql`${pertanyaan.jawaban} is null`);

  const kpi = {
    akun: Number(akun?.total ?? 0),
    akunTerverifikasi: Number(akun?.terverifikasi ?? 0),
    akunHariIni: Number(akun?.hariIni ?? 0),
    masuk: n(["terkirim", "diperiksa", "diterima", "ditolak"]),
    kirimHariIni: Number(kirimHariIni?.n ?? 0),
    proses: n(["terkirim", "diperiksa"]),
    diterima: n(["diterima"]),
    tidakDiterima: n(["ditolak"]) - Number(gugurAdm),
    gugurAdministrasi: Number(gugurAdm),
    belumKirim: n(["draft", "perbaikan"]),
    pertanyaanBaru: Number(belumDijawab),
  };

  // --- Tren harian (WIB) -------------------------------------------------------
  const akunHarian = await rows<{ tgl: string; n: number }>(sql`
    select date_format(date_add(created_at, interval 7 hour), '%Y-%m-%d') tgl, count(*) n
    from users where role = 'pendaftar' and created_at >= ${awalRentang} group by tgl`);
  const kirimHarian = await rows<{ tgl: string; n: number }>(sql`
    select date_format(date_add(p.submitted_at, interval 7 hour), '%Y-%m-%d') tgl, count(*) n
    from pendaftaran p where p.submitted_at >= ${awalRentang} ${gSql} group by tgl`);
  const tren = Array.from({ length: hari }, (_, i) => {
    const tgl = tglWib(new Date(awalRentang.getTime() + i * 864e5));
    return {
      tanggal: tgl,
      akun: Number(akunHarian.find((r) => r.tgl === tgl)?.n ?? 0),
      kirim: Number(kirimHarian.find((r) => r.tgl === tgl)?.n ?? 0),
    };
  });

  // --- Tahap seleksi (yang masih berproses) + hasil ------------------------------------
  const tahapRows = await db
    .select({ tahap: pendaftaran.tahap, n: sql<number>`count(*)` })
    .from(pendaftaran)
    .where(and(fG, inArray(pendaftaran.status, ["terkirim", "diperiksa"])))
    .groupBy(pendaftaran.tahap);
  const perTahap = TAHAP.filter((t) => t !== "pengumuman").map((t) => ({
    tahap: t,
    label: TAHAP_LABEL[t],
    n: tahapRows.filter((r) => (r.tahap ?? "administrasi") === t).reduce((a, r) => a + Number(r.n), 0),
  }));

  // --- Jurusan: peminat pilihan 1 & 2, dan yang diterima ---------------------------------
  const jurusanRows = await rows<{ nama: string; p1: number; p2: number; diterima: number }>(sql`
    select j.nama,
      (select count(*) from pilihan_jurusan pj join pendaftaran p on p.id = pj.pendaftaran_id
        where pj.jurusan_1_id = j.id and ${dikirim} ${gSql}) p1,
      (select count(*) from pilihan_jurusan pj join pendaftaran p on p.id = pj.pendaftaran_id
        where pj.jurusan_2_id = j.id and ${dikirim} ${gSql}) p2,
      (select count(*) from pendaftaran p where p.jurusan_diterima_id = j.id and p.hasil = 'diterima' ${gSql}) diterima
    from jurusan j where j.aktif = 1 order by j.nama`);

  // --- Rekomendasi, desil, kabupaten ---------------------------------------------------
  const rekomRows = await rows<{ nama: string; n: number }>(sql`
    select s.nama, count(p.id) n from sumber_rekomendasi s
    left join rekomendasi r on r.sumber_id = s.id
    left join pendaftaran p on p.id = r.pendaftaran_id and ${dikirim} ${gSql}
    group by s.id, s.nama, s.urutan order by s.urutan, s.nama`);
  const desilRows = await rows<{ desil: string | null; n: number }>(sql`
    select d.desil, count(*) n from data_diri d join pendaftaran p on p.id = d.pendaftaran_id
    where ${dikirim} ${gSql} group by d.desil`);
  const desil = Object.keys(DESIL_LABEL).map((k) => ({ label: DESIL_LABEL[k], n: Number(desilRows.find((r) => r.desil === k)?.n ?? 0) }));
  const kabupaten = await rows<{ nama: string; n: number }>(sql`
    select k.nama, count(*) n from data_diri d
    join pendaftaran p on p.id = d.pendaftaran_id
    join wilayah_kabupaten k on k.id = d.kabupaten_id
    where ${dikirim} ${gSql} group by k.id, k.nama order by n desc, k.nama limit 6`);

  // --- Aktivitas terbaru -------------------------------------------------------------
  const aktivitasRows = await db
    .select({
      id: riwayatStatus.id,
      status: riwayatStatus.status,
      catatan: riwayatStatus.catatan,
      waktu: riwayatStatus.createdAt,
      pendaftaranId: riwayatStatus.pendaftaranId,
      nama: sql<string>`coalesce(${dataDiri.namaLengkap}, pemilik.nama)`,
      olehRole: users.role,
    })
    .from(riwayatStatus)
    .innerJoin(pendaftaran, eq(pendaftaran.id, riwayatStatus.pendaftaranId))
    .innerJoin(sql`users pemilik`, sql`pemilik.id = ${pendaftaran.userId}`)
    .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
    .leftJoin(users, eq(users.id, riwayatStatus.diubahOleh))
    .where(fG)
    .orderBy(desc(riwayatStatus.createdAt))
    .limit(8);

  return {
    diperbarui: sekarang.toISOString(),
    gelombang: gelombang ?? null,
    hari,
    kpi,
    tren,
    perTahap,
    jurusan: jurusanRows.map((r) => ({ nama: r.nama, p1: Number(r.p1), p2: Number(r.p2), diterima: Number(r.diterima) })),
    rekomendasi: rekomRows.map((r) => ({ nama: r.nama, n: Number(r.n) })),
    desil,
    kabupaten: kabupaten.map((r) => ({ nama: r.nama, n: Number(r.n) })),
    aktivitas: aktivitasRows.map((a) => ({
      id: a.id,
      label: labelRiwayat(a.status),
      catatan: a.catatan,
      waktu: a.waktu.toISOString(),
      pendaftaranId: a.pendaftaranId,
      nama: a.nama,
      olehAdmin: a.olehRole === "admin",
    })),
  };
}

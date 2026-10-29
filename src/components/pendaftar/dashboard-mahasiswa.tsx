import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { laporanAkademik } from "@/db/schema";
import { BannerPengumuman } from "@/components/pendaftar/banner-pengumuman";
import { GrafikIpk } from "@/components/grafik-ipk";
import { GrafikMahasiswa } from "@/components/grafik-mahasiswa";
import { Hero, HeroStat } from "@/components/hero";
import { Alert, ButtonLink, Card, Dl, StatusMahasiswaBadge } from "@/components/ui";
import { bukuTabunganSaya, wajibBukuTabungan } from "@/lib/buku-tabungan";
import { tanggal } from "@/lib/constants";
import { kegiatanUntukMahasiswa, statusKegiatan } from "@/lib/kegiatan";
import type { PendaftaranLengkap } from "@/lib/pendaftaran";
import { ambilStatistikIpk } from "@/lib/statistik-ipk";
import { ambilStatistikMahasiswa } from "@/lib/statistik-mahasiswa";

/** Kelompok IPK dengan anggota kurang dari ini disembunyikan agar IPK individu tidak terbaca. */
const MINIMAL_N = 3;

const ipk = (v: string | number) => Number(v).toFixed(2).replace(".", ",");
const waktu = (d: Date) => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(d);

/** Beranda untuk pendaftar yang sudah menjadi mahasiswa KIP Kuliah (menggantikan ringkasan pendaftaran). */
export async function DashboardMahasiswa({ nama, d }: { nama: string; d: PendaftaranLengkap }) {
  const db = await getDb();
  const [laporan, kegiatan, statistik, grafikIpk, wajibBt, bt] = await Promise.all([
    db.select().from(laporanAkademik).where(eq(laporanAkademik.pendaftaranId, d.id)).orderBy(asc(laporanAkademik.semester)),
    kegiatanUntukMahasiswa(d.id),
    ambilStatistikMahasiswa(),
    ambilStatistikIpk(MINIMAL_N),
    wajibBukuTabungan(d.id),
    bukuTabunganSaya(d.id),
  ]);
  const terakhir = laporan.at(-1);
  const angkatan = d.angkatan ?? new Date(d.user.createdAt.getTime() + 7 * 3600e3).getUTCFullYear();
  const sekarang = new Date();
  const mendatang = kegiatan
    .filter((k) => statusKegiatan(k, sekarang) !== "selesai")
    .sort((a, b) => a.mulai.getTime() - b.mulai.getTime())
    .slice(0, 3);
  const selesai = kegiatan.filter((k) => statusKegiatan(k, sekarang) === "selesai");
  const hadir = selesai.filter((k) => k.waktuHadir).length;
  const akademikBelum = !d.nim || !d.kelas;

  return (
    <div className="space-y-6">
      <BannerPengumuman pendaftaranId={d.id} />
      <Hero eyebrow="Dashboard Mahasiswa KIP Kuliah" title={`Halo, ${nama.split(" ")[0]}!`} desc="Pantau data akademik, laporan IPK, dan kegiatan kemahasiswaan Anda sebagai penerima KIP Kuliah.">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <HeroStat label="NIM" value={d.nim ?? "Belum diisi"} />
          <HeroStat label="Angkatan" value={angkatan} />
          <HeroStat label="IPK terakhir" value={terakhir ? ipk(terakhir.ipk) : "-"} />
          <HeroStat label="Kehadiran kegiatan" value={selesai.length ? `${hadir}/${selesai.length}` : "-"} />
        </div>
      </Hero>

      {wajibBt && !bt && (
        <Alert tone="warning" title="Buku tabungan KIP-K belum dikirim">
          Kirim nomor rekening KIP-K dan foto buku tabungan di <Link href="/mahasiswa/buku-tabungan" className="font-semibold underline">menu Buku Tabungan</Link>.
        </Alert>
      )}

      {akademikBelum && (
        <Alert tone="warning" title="NIM dan kelas belum lengkap">
          Isi NIM dan kelas Anda di <Link href="/mahasiswa" className="font-semibold underline">halaman Mahasiswa</Link> setelah mendapatkannya dari bagian akademik.
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Data akademik" action={<StatusMahasiswaBadge status={d.statusMahasiswa} />}>
          <Dl
            items={[
              ["Program studi", d.jurusanDiterima],
              ["Kelas", d.kelas],
              ["NIM", d.nim],
              ["Angkatan", String(angkatan)],
              ...(wajibBt ? ([["No. rekening KIP-K", bt ? <span key="rek" className="font-mono">{bt.noRekening}</span> : <Link key="rek" href="/mahasiswa/buku-tabungan" className="font-semibold text-blue-700 hover:underline">Belum dikirim, isi sekarang</Link>]] as [string, React.ReactNode][]) : []),
            ]}
          />
          <div className="mt-5">
            <ButtonLink href="/mahasiswa" variant="secondary">
              Buka Data Mahasiswa
            </ButtonLink>
          </div>
        </Card>

        <Card
          title="Laporan IPK"
          action={
            <Link href="/mahasiswa/ipk" className="text-sm font-semibold text-blue-700 hover:underline">
              Laporkan IPK
            </Link>
          }
        >
          {laporan.length === 0 ? (
            <p className="text-sm text-slate-600">Belum ada laporan. Laporkan IPK tiap semester beserta transkrip nilai Anda.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {laporan
                .slice(-4)
                .reverse()
                .map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="font-medium text-slate-900">Semester {l.semester}</span>
                    <span className="tabular-nums font-semibold text-slate-900">IPK {ipk(l.ipk)}</span>
                    <span className="text-xs text-slate-500">{tanggal(l.updatedAt)}</span>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>

      <Card
        title="Kegiatan kemahasiswaan"
        action={
          <Link href="/mahasiswa/kegiatan" className="text-sm font-semibold text-blue-700 hover:underline">
            Semua kegiatan
          </Link>
        }
      >
        {mendatang.length === 0 ? (
          <p className="text-sm text-slate-600">Belum ada kegiatan yang akan datang.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {mendatang.map((k) => {
              const berlangsung = statusKegiatan(k, sekarang) === "berlangsung";
              return (
                <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{k.nama}</p>
                    <p className="text-xs text-slate-500">
                      {waktu(k.mulai)}
                      {k.lokasi && ` · ${k.lokasi}`}
                    </p>
                  </div>
                  {k.waktuHadir ? (
                    <span className="text-xs font-semibold text-emerald-700">Sudah hadir</span>
                  ) : berlangsung ? (
                    <Link href="/mahasiswa/kegiatan/scan" className="text-xs font-semibold text-blue-700 hover:underline">
                      Sedang berlangsung · Scan presensi
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-500">Akan datang</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <section aria-labelledby="judul-statistik-kip" className="space-y-4">
        <div>
          <h2 id="judul-statistik-kip" className="text-lg font-bold text-slate-900">
            Statistik Mahasiswa KIP Kuliah
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">Gambaran seluruh mahasiswa penerima KIP Kuliah Politeknik TEDC Bandung.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Angka label="Total mahasiswa KIP-K" nilai={statistik.total.total.toLocaleString("id-ID")} />
          <Angka label="Mahasiswa aktif" nilai={statistik.total.aktif.toLocaleString("id-ID")} warna="text-emerald-700" />
          <Angka
            label="Rata-rata IPK"
            nilai={statistik.rataIpk != null && statistik.melapor >= MINIMAL_N ? ipk(statistik.rataIpk) : "-"}
            ket={statistik.melapor >= MINIMAL_N ? `Dari ${statistik.melapor} mahasiswa yang sudah melapor` : "Belum cukup laporan"}
            warna="text-blue-800"
          />
        </div>
        <GrafikMahasiswa total={statistik.total} angkatan={statistik.angkatan} jurusan={statistik.jurusan} />
        <GrafikIpk data={grafikIpk} tandaiAngkatan={String(angkatan)} tandaiJurusan={d.jurusanDiterima ?? undefined} />
      </section>
    </div>
  );
}

function Angka({ label, nilai, ket, warna = "text-slate-900" }: { label: string; nilai: string; ket?: string; warna?: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${warna}`}>{nilai}</p>
      {ket && <p className="mt-1 text-xs text-slate-500">{ket}</p>}
    </section>
  );
}

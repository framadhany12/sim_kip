import Link from "next/link";
import { ProsesSeleksi } from "@/components/proses-seleksi";
import { DashboardMahasiswa } from "@/components/pendaftar/dashboard-mahasiswa";
import { Hero, HeroStat } from "@/components/hero";
import { Alert, ButtonLink, Card, StatusBadge } from "@/components/ui";
import { LANGKAH, TAHAP_DESKRIPSI, TAHAP_LABEL, tanggal } from "@/lib/constants";
import { StatistikSeleksi } from "@/components/pendaftar/statistik-seleksi";
import { konteksPendaftar } from "@/lib/konteks";
import { sudahMahasiswa } from "@/lib/pendaftaran";
import { ambilStatistikPendaftar } from "@/lib/statistik-pendaftar";

export const metadata = { title: "Beranda" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ terverifikasi?: string }> }) {
  const { user, d, cek, sudahDikirim, terkunci } = await konteksPendaftar();
  // Sudah menjadi mahasiswa: beranda berganti menjadi Dashboard Mahasiswa KIP.
  if (sudahMahasiswa(d)) return <DashboardMahasiswa nama={user.nama} d={d} />;
  const { terverifikasi } = await searchParams;
  const statistik = await ambilStatistikPendaftar();
  const berikutnya = LANGKAH.find((l) => !cek.langkah[l.slug]) ?? LANGKAH[LANGKAH.length - 1];
  // Pengumuman, atau gugur di tahap sebelumnya (mis. tidak lolos Seleksi Administrasi).
  const diumumkan = !!d.hasil;

  return (
    <div className="space-y-6">
      {terverifikasi && (
        <Alert tone="success" title="Email terverifikasi, akun aktif 🎉">
          Langkah pertama selesai. Lanjutkan dengan mengisi formulir pendaftaran.
        </Alert>
      )}
      <Hero eyebrow="KIP Kuliah · Poltek TEDC" title={`Halo, ${user.nama.split(" ")[0]}!`} desc="Pantau kelengkapan formulir, tahap seleksi, dan hasil pendaftaran Anda di sini.">
        <div className="grid grid-cols-2 gap-2.5 sm:max-w-md">
          <HeroStat label="Kelengkapan" value={`${cek.persen}%`} />
          <HeroStat label={sudahDikirim ? "Tahap seleksi" : "Status"} value={sudahDikirim ? TAHAP_LABEL[d.tahap ?? "administrasi"] : d.status === "perbaikan" ? "Perlu perbaikan" : "Belum dikirim"} />
        </div>
      </Hero>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Pendaftaran Anda" action={<StatusBadge status={d.status} tahap={d.tahap} usulan={d.usulan} />}>
          {!sudahDikirim ? (
            <>
              <div className="flex items-baseline justify-between">
                <p className="text-sm text-slate-600">Kelengkapan formulir</p>
                <p className="text-2xl font-bold tabular-nums text-slate-900">{cek.persen}%</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={cek.persen} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-blue-700" style={{ width: `${cek.persen}%` }} />
              </div>
              <ul className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">
                {LANGKAH.slice(0, -1).map((l) => (
                  <li key={l.slug} className="flex items-center gap-2">
                    <span className={cek.langkah[l.slug] ? "text-emerald-600" : "text-slate-300"}>{cek.langkah[l.slug] ? "✓" : "○"}</span>
                    <Link href={`/formulir/${l.slug}`} className="text-slate-700 hover:text-blue-700 hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {d.status === "perbaikan" && (
                <div className="mt-4">
                  <Alert tone="warning" title="Perlu perbaikan">
                    {d.catatanAdmin}
                  </Alert>
                </div>
              )}
              <div className="mt-5">
                <ButtonLink href={`/formulir/${berikutnya.slug}`}>
                  {cek.persen === 0 ? "Mulai Isi Formulir" : cek.siapKirim ? "Periksa & Kirim" : `Lanjutkan: ${berikutnya.label}`} →
                </ButtonLink>
              </div>
            </>
          ) : (
            <>
              {diumumkan ? (
                <p className="text-[15px] text-slate-700">
                  {d.hasil === "diterima" ? (
                    <>
                      Selamat! Anda <b className="text-emerald-800">diterima</b> sebagai penerima KIP Kuliah
                      {d.jurusanDiterima && (
                        <>
                          {" "}
                          di program studi <b>{d.jurusanDiterima}</b>
                        </>
                      )}
                      .
                    </>
                  ) : d.tahap && d.tahap !== "pengumuman" ? (
                    <>
                      Mohon maaf, Anda <b className="text-rose-800">tidak lolos {TAHAP_LABEL[d.tahap]}</b>
                      {d.alasanDitolak && <> dengan alasan: {d.alasanDitolak}</>}.
                    </>
                  ) : (
                    <>
                      Mohon maaf, pendaftaran KIP Kuliah Anda <b className="text-rose-800">tidak diterima</b>
                      {d.alasanDitolak && <> dengan alasan: {d.alasanDitolak}</>}.
                    </>
                  )}
                </p>
              ) : (
                <>
                  <p className="text-sm text-slate-500">Tahap saat ini</p>
                  <p className="text-xl font-bold text-blue-900">{TAHAP_LABEL[d.tahap ?? "administrasi"]}</p>
                  <p className="mt-1 text-[15px] text-slate-700">{TAHAP_DESKRIPSI[d.tahap ?? "administrasi"]}</p>
                  {d.tahap === "pengusulan" && d.usulan === "menunggu" && (
                    <div className="mt-3">
                      <Alert tone="warning" title="Perlu jawaban Anda">
                        Apakah Anda bersedia diusulkan sebagai penerima KIP Kuliah? <Link href="/status" className="font-semibold underline">Jawab di halaman Status</Link>.
                      </Alert>
                    </div>
                  )}
                  {d.tahap === "pengusulan" && d.usulan === "bersedia" && <p className="mt-2 text-sm font-semibold text-emerald-800">Status: Diusulkan, menunggu pengumuman.</p>}
                </>
              )}
              {d.catatanAdmin && (
                <div className="mt-4">
                  <Alert tone="info" title="Catatan dari admin">
                    <span className="whitespace-pre-line">{d.catatanAdmin}</span>
                  </Alert>
                </div>
              )}
              <p className="mt-2 text-sm text-slate-500">Dikirim: {tanggal(d.submittedAt)}</p>
              <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">
                <ButtonLink href="/status">Lihat Detail Status →</ButtonLink>
                <ButtonLink href="/formulir/ringkasan" variant="secondary">
                  {terkunci ? "Lihat Data Pendaftaran" : "Perbarui Data & Berkas"}
                </ButtonLink>
              </div>
            </>
          )}
        </Card>

        <Card title="Proses seleksi">
          <ProsesSeleksi
            status={d.status}
            tahap={d.tahap}
            hasil={d.hasil}
            jurusanDiterima={d.jurusanDiterima}
            alasan={d.alasanDitolak}
            submittedAt={d.submittedAt}
            riwayat={d.riwayat}
            ringkas
          />
          <p className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-600">
            Bingung mengisi?{" "}
            <Link href="/bantuan" className="font-semibold text-blue-700 hover:underline">
              Buka Bantuan
            </Link>
          </p>
        </Card>
      </div>

      <StatistikSeleksi s={statistik} />
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ArrowUpRight, Check } from "lucide-react";
import { getDb } from "@/db";
import { jurusan } from "@/db/schema";
import { KreditAplikasi } from "@/components/kredit-aplikasi";
import { LogoTedc } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth";
import { ambilLanding } from "@/lib/landing";
import { KAMPUS, KIP } from "@/lib/profil";

// Sudut: tombol dan item 8px (rounded-lg), panel 16px (rounded-2xl), penanda langkah bulat.

/** null = database tidak bisa diakses; landing page tetap tampil dengan pesan pengganti. */
async function daftarJurusan() {
  try {
    const db = await getDb();
    return await db.select({ kode: jurusan.kode, nama: jurusan.nama }).from(jurusan).where(eq(jurusan.aktif, true)).orderBy(asc(jurusan.nama));
  } catch {
    return null;
  }
}

const OPSIONAL = /\s*\(opsional\)\s*/i;

function Judul({ label, children, id }: { label?: string; children: React.ReactNode; id?: string }) {
  return (
    <div id={id}>
      {label && <p className="mb-1.5 text-sm font-semibold text-blue-700">{label}</p>}
      <h2 className="text-2xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-3xl">{children}</h2>
    </div>
  );
}

function TautanLuar({ href, children, className }: { href: string; children: React.ReactNode; className: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
      {/* Panah menandai tautan ke situs lain yang terbuka di tab baru. */}
      <ArrowUpRight aria-hidden strokeWidth={1.8} className="ml-0.5 inline size-3.5 align-[-1px]" />
      <span className="sr-only"> (membuka tab baru)</span>
    </a>
  );
}

function DaftarBerkas({ item }: { item: string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-base text-slate-700 marker:text-slate-400">
      {item.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<{ pratinjau?: string }> }) {
  const user = await getCurrentUser();
  const { pratinjau } = await searchParams;
  // Admin boleh melihat landing page lewat ?pratinjau=1 (dipakai tombol di Informasi → Landing Page).
  if (user && !(user.role === "admin" && pratinjau)) redirect(user.role === "admin" ? "/admin" : "/dashboard");
  const [prodi, { konten: k }] = await Promise.all([daftarJurusan(), ambilLanding()]);
  const berkasWajib = k.berkas.item.filter((t) => !OPSIONAL.test(t));
  const berkasOpsional = k.berkas.item.filter((t) => OPSIONAL.test(t)).map((t) => t.replace(OPSIONAL, " ").trim());

  return (
    <main id="konten">
      {k.banner.aktif && k.banner.teks && (
        <div role="status" className="bg-[#f5c400] px-4 py-2.5 text-center text-base font-semibold text-[#0d2a63]">
          {k.banner.teks}
        </div>
      )}

      <section className="latar-tua relative bg-[#0d2a63] text-white">
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-[#f5c400] via-[#f5c400] to-[#1e8e3e]" />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:pb-28 md:pt-20">
          <div className="hero-urut max-w-3xl">
            <h1 className="text-[clamp(1.875rem,1.2rem+3vw,3rem)] font-extrabold leading-[1.1] tracking-tight text-balance">
              {k.hero.judul}
              {k.hero.sorot && <> <span className="text-[#f5c400]">{k.hero.sorot}</span></>}
            </h1>
            <p className="mt-5 max-w-xl text-base text-blue-100 sm:text-lg">{k.hero.deskripsi}</p>
            <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
              <Link href="/daftar" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#f5c400] px-6 font-bold text-[#0d2a63] hover:bg-[#ffd633]">
                Buat akun pendaftar
              </Link>
              <Link href="/masuk" className="inline-flex min-h-12 items-center justify-center rounded-lg px-6 font-semibold text-white ring-1 ring-white/40 hover:bg-white/10">
                Sudah punya akun? Masuk
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Panel syarat naik menutupi tepi hero: hal pertama yang dicek pendaftar, jadi satu-satunya yang terangkat. */}
      <section aria-labelledby="judul-syarat" className="mx-auto max-w-6xl px-4">
        <div className="relative -mt-8 grid gap-8 rounded-2xl bg-white p-6 text-slate-800 shadow-[0_16px_40px_-16px_rgb(13_42_99/0.35)] ring-1 ring-slate-200 sm:p-8 md:-mt-14 md:grid-cols-2 md:gap-12">
          <div>
            <h2 id="judul-syarat" className="text-lg font-bold text-slate-900">{k.syarat.judul}</h2>
            <ul className="mt-3 space-y-2.5 text-base">
              {k.syarat.item.map((t) => (
                <li key={t} className="flex gap-2.5">
                  <Check aria-hidden strokeWidth={2.2} className="mt-0.5 size-4 shrink-0 text-blue-700" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-slate-200 pt-6 md:border-l md:border-t-0 md:pl-12 md:pt-0">
            <h2 className="text-lg font-bold text-slate-900">{k.berkas.judul}</h2>
            {berkasOpsional.length > 0 ? (
              <div className="mt-3 grid gap-5 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-600">Wajib</h3>
                  <DaftarBerkas item={berkasWajib} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-600">Bila ada</h3>
                  <DaftarBerkas item={berkasOpsional} />
                </div>
              </div>
            ) : (
              <DaftarBerkas item={berkasWajib} />
            )}
            {k.berkas.catatan && <p className="mt-4 text-sm text-slate-600">{k.berkas.catatan}</p>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
          <div>
            <Judul label="Tentang KIP Kuliah" id="tentang-kip">
              {k.kip.judul}
            </Judul>
            <p className="mt-4 text-base leading-relaxed text-slate-700">{k.kip.ringkas}</p>
            <h3 className="mt-6 text-sm font-bold text-slate-900">Diperuntukkan bagi</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-base text-slate-700 marker:text-blue-700">
              {k.kip.sasaran.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-slate-600">
              Informasi resmi:{" "}
              <TautanLuar href={KIP.situsResmi} className="font-semibold text-blue-700 underline-offset-2 hover:underline">
                {KIP.situsLabel}
              </TautanLuar>
            </p>
          </div>
          {/* Manfaat dibaca berurutan seperti rincian, jadi daftar bergaris, bukan deretan kartu. */}
          <div className="self-start rounded-2xl border border-slate-200 bg-white">
            <h3 className="border-b border-slate-200 px-5 py-3 text-sm font-bold text-slate-900">Yang ditanggung KIP Kuliah</h3>
            <dl className="divide-y divide-slate-200">
              {k.kip.manfaat.map((m) => (
                <div key={m.judul} className="px-5 py-4">
                  <dt className="font-bold text-slate-900">{m.judul}</dt>
                  <dd className="mt-1 text-base text-slate-600">{m.isi}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <Judul id="tentang-tedc">{KAMPUS.nama}</Judul>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-700">{k.kampus.ringkas}</p>
          <dl className="mt-6 grid gap-x-8 gap-y-4 border-t border-slate-200 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Berdiri", KAMPUS.berdiri],
              ["Dasar hukum", KAMPUS.dasarHukum],
              ["Penyelenggara", KAMPUS.penyelenggara],
              ["Jenjang", "Diploma III dan Diploma IV (Sarjana Terapan)"],
            ].map(([label, isi]) => (
              <div key={label}>
                <dt className="text-sm text-slate-600">{label}</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">{isi}</dd>
              </div>
            ))}
            <div className="sm:col-span-2 lg:col-span-4">
              <dt className="text-sm text-slate-600">Alamat kampus</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">{k.kampus.alamat}</dd>
            </div>
          </dl>

          <div className="mt-12">
            <h3 className="text-lg font-bold text-slate-900">Program studi yang dapat dipilih pendaftar KIP Kuliah</h3>
            {prodi === null ? (
              <p className="mt-2 text-base text-slate-600">
                Daftar program studi sedang tidak dapat dimuat. Muat ulang halaman ini beberapa saat lagi, atau lihat di{" "}
                <TautanLuar href={KAMPUS.website} className="font-semibold text-blue-700 hover:underline">
                  {KAMPUS.websiteLabel}
                </TautanLuar>
                .
              </p>
            ) : prodi.length === 0 ? (
              <p className="mt-2 text-base text-slate-600">Program studi untuk tahun ini belum dibuka. Pantau halaman ini atau tanyakan lewat Bantuan &amp; FAQ.</p>
            ) : (
              <>
                <p className="mt-1 text-base text-slate-600">Pilih dua di antaranya sebagai Jurusan 1 dan Jurusan 2 saat mengisi formulir.</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {prodi.map((p) => (
                    <li key={p.kode} className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 px-4 py-3">
                      <span className="grid h-8 min-w-10 shrink-0 place-items-center rounded-lg bg-[#0d2a63] px-2 font-mono text-xs font-bold text-white">{p.kode}</span>
                      <span className="min-w-0 text-base font-medium text-slate-800">{p.nama}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <Judul id="alur">{k.alur.judul}</Judul>
        {/* Garis waktu: tegak di layar sempit, mendatar di layar lebar, karena langkahnya memang berurutan. */}
        <ol className="mt-8 grid lg:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] lg:gap-6">
          {k.alur.langkah.map(({ judul: t, isi: d }, i) => (
            <li key={t} className="relative border-l-2 border-slate-200 pb-7 pl-7 last:pb-0 lg:border-l-0 lg:border-t-2 lg:pb-0 lg:pl-0 lg:pt-7">
              <span className="absolute -left-[15px] top-0 grid size-7 place-items-center rounded-full bg-[#0d2a63] text-sm font-bold text-white ring-4 ring-[#f4f6fa] lg:-top-[15px] lg:left-0 dark:ring-[#0b1220]">
                {i + 1}
              </span>
              <h3 className="font-semibold text-slate-900">{t}</h3>
              <p className="mt-1 text-base text-slate-600">{d}</p>
            </li>
          ))}
        </ol>
        {/* Biru tua + tombol kuning mengulang hero, agar ajakan mendaftar tampil sama di awal dan akhir halaman. */}
        <div className="latar-tua mt-12 flex flex-col gap-4 rounded-2xl bg-[#0d2a63] p-6 text-white ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-lg font-bold">Pendaftaran dimulai dari akun</p>
            <p className="mt-1 text-base text-blue-100">
              Siapkan email aktif dan berkas di atas. Ragu saat mengisi? Baca{" "}
              <Link href="/bantuan" className="font-semibold text-[#f5c400] underline-offset-2 hover:underline">
                Panduan &amp; Pertanyaan Umum
              </Link>
              .
            </p>
          </div>
          <Link href="/daftar" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg bg-[#f5c400] px-6 font-bold text-[#0d2a63] hover:bg-[#ffd633]">
            Buat akun pendaftar
          </Link>
        </div>
      </section>

      <footer className="latar-tua bg-[#0d2a63] text-blue-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm sm:flex-row sm:items-start sm:justify-between">
          <div className="flex max-w-md items-start gap-3">
            <LogoTedc size={48} priority={false} />
            <div>
              <p className="font-bold text-white">{KAMPUS.nama}</p>
              <p className="mt-1">{k.kampus.alamat}</p>
              <TautanLuar href={KAMPUS.website} className="mt-1 inline-flex min-h-11 items-center text-[#f5c400] hover:underline">
                {KAMPUS.websiteLabel}
              </TautanLuar>
            </div>
          </div>
          <nav className="flex flex-wrap gap-x-5 sm:grid sm:gap-0" aria-label="Tautan bawah">
            <Link href="/daftar" className="inline-flex min-h-11 items-center hover:text-white">Daftar akun</Link>
            <Link href="/masuk" className="inline-flex min-h-11 items-center hover:text-white">Masuk</Link>
            <Link href="/bantuan" className="inline-flex min-h-11 items-center hover:text-white">Bantuan &amp; FAQ</Link>
          </nav>
        </div>
        <div className="border-t border-white/10">
          <KreditAplikasi gelap className="mx-auto max-w-6xl px-4 py-4" />
        </div>
      </footer>
    </main>
  );
}

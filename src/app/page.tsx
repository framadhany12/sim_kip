import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { jurusan } from "@/db/schema";
import { LogoTedc } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth";
import { ambilLanding } from "@/lib/landing";
import { KAMPUS, KIP } from "@/lib/profil";

async function daftarJurusan() {
  try {
    const db = await getDb();
    return await db.select({ kode: jurusan.kode, nama: jurusan.nama }).from(jurusan).where(eq(jurusan.aktif, true)).orderBy(asc(jurusan.nama));
  } catch {
    return []; // landing page tetap tampil walau database sedang tidak bisa diakses
  }
}

function Judul({ eyebrow, children, id }: { eyebrow: string; children: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="scroll-mt-24">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-3xl">{children}</h2>
    </div>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<{ pratinjau?: string }> }) {
  const user = await getCurrentUser();
  const { pratinjau } = await searchParams;
  // Admin boleh melihat landing page lewat ?pratinjau=1 (dipakai tombol di Informasi → Landing Page).
  if (user && !(user.role === "admin" && pratinjau)) redirect(user.role === "admin" ? "/admin" : "/dashboard");
  const [prodi, { konten: k }] = await Promise.all([daftarJurusan(), ambilLanding()]);

  return (
    <main>
      {k.banner.aktif && k.banner.teks && (
        <div role="status" className="bg-[#f5c400] px-4 py-2.5 text-center text-sm font-semibold text-[#0d2a63]">
          {k.banner.teks}
        </div>
      )}
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0d2a63] text-white">
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-[#f5c400] via-[#f5c400] to-[#1e8e3e]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1.25fr_1fr] md:py-20">
          <div>
            <div className="flex items-center gap-3">
              <LogoTedc size={56} />
              <div className="leading-tight">
                <p className="text-sm font-bold">{KAMPUS.nama}</p>
                <p className="text-xs text-blue-100/80">Penerimaan KIP Kuliah</p>
              </div>
            </div>
            <h1 className="mt-8 text-3xl font-extrabold leading-[1.1] tracking-tight text-balance sm:text-5xl">
              {k.hero.judul}{k.hero.sorot && <> <span className="text-[#f5c400]">{k.hero.sorot}</span></>}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-blue-100">
              {k.hero.deskripsi}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/daftar" className="rounded-lg bg-[#f5c400] px-6 py-3 font-bold text-[#0d2a63] shadow-sm hover:bg-[#ffd633]">
                Daftar Sekarang
              </Link>
              <Link href="/masuk" className="rounded-lg px-6 py-3 font-semibold text-white ring-1 ring-white/40 hover:bg-white/10">
                Sudah punya akun? Masuk
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 text-slate-800 shadow-xl">
            <h2 className="font-bold text-slate-900">{k.syarat.judul}</h2>
            <ul className="mt-3 space-y-2.5 text-[15px]">
              {k.syarat.item.map((t) => (
                <li key={t} className="flex gap-2.5">
                  <span className="font-bold text-emerald-600">✓</span> {t}
                </li>
              ))}
            </ul>
            <h2 className="mt-6 font-bold text-slate-900">{k.berkas.judul}</h2>
            <ul className="mt-3 space-y-1.5 text-[15px] text-slate-700">
              {k.berkas.item.map((t) => (
                <li key={t} className="flex gap-2.5">
                  <span className="text-slate-400">•</span> {t}
                </li>
              ))}
            </ul>
            {k.berkas.catatan && <p className="mt-4 text-xs text-slate-500">{k.berkas.catatan}</p>}
          </div>
        </div>
      </section>

      {/* Tentang KIP Kuliah */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.35fr]">
          <div>
            <Judul eyebrow="Tentang KIP Kuliah" id="tentang-kip">
              {k.kip.judul}
            </Judul>
            <p className="mt-4 text-[16px] leading-relaxed text-slate-700">{k.kip.ringkas}</p>
            <h3 className="mt-6 text-sm font-bold text-slate-900">Diperuntukkan bagi</h3>
            <ul className="mt-2 space-y-2 text-[15px] text-slate-700">
              {k.kip.sasaran.map((s) => (
                <li key={s} className="flex gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-700" />
                  {s}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-slate-600">
              Informasi resmi:{" "}
              <a href={KIP.situsResmi} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline">
                {KIP.situsLabel} ↗
              </a>
            </p>
          </div>
          <div className="grid content-start gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {k.kip.manfaat.map((m) => (
              <div key={m.judul} className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-slate-900">{m.judul}</h3>
                <p className="mt-1.5 text-[15px] text-slate-600">{m.isi}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tentang Politeknik TEDC */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
            <div className="hidden lg:block">
              <LogoTedc size={180} />
            </div>
            <div>
              <Judul eyebrow="Tentang Kampus" id="tentang-tedc">
                {KAMPUS.nama}
              </Judul>
              <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-slate-700">{k.kampus.ringkas}</p>
              <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {[
                  ["Berdiri", KAMPUS.berdiri],
                  ["Dasar hukum", KAMPUS.dasarHukum],
                  ["Penyelenggara", KAMPUS.penyelenggara],
                  ["Jenjang", "Diploma III dan Diploma IV (Sarjana Terapan)"],
                ].map(([k, v]) => (
                  <div key={k} className="border-l-2 border-[#f5c400] pl-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k}</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{v}</dd>
                  </div>
                ))}
                <div className="border-l-2 border-[#f5c400] pl-3 sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Alamat kampus</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{k.kampus.alamat}</dd>
                </div>
              </dl>
            </div>
          </div>

          {prodi.length > 0 && (
            <div className="mt-12">
              <h3 className="text-lg font-bold text-slate-900">Program studi yang dapat dipilih pendaftar KIP Kuliah</h3>
              <p className="mt-1 text-sm text-slate-600">Pilih dua di antaranya sebagai Jurusan 1 dan Jurusan 2 saat mengisi formulir.</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {prodi.map((p) => (
                  <li key={p.kode} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="grid h-8 min-w-10 place-items-center rounded-md bg-[#0d2a63] px-2 font-mono text-xs font-bold text-white">{p.kode}</span>
                    <span className="text-[15px] font-medium text-slate-800">{p.nama}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Alur */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Judul eyebrow="Cara mendaftar" id="alur">
          {k.alur.judul}
        </Judul>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]">
          {k.alur.langkah.map(({ judul: t, isi: d }, i) => (
            <li key={t} className="rounded-xl border border-slate-200 bg-white p-5">
              <span className="grid size-8 place-items-center rounded-full bg-blue-700 text-sm font-bold text-white">{i + 1}</span>
              <h3 className="mt-3 font-semibold text-slate-900">{t}</h3>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-blue-50 px-6 py-6 ring-1 ring-blue-100">
          <div>
            <p className="text-lg font-bold text-slate-900">Siap mendaftar KIP Kuliah di Politeknik TEDC?</p>
            <p className="text-sm text-slate-600">
              Butuh bantuan mengisi? Baca{" "}
              <Link href="/bantuan" className="font-semibold text-blue-700 hover:underline">
                Panduan &amp; Pertanyaan Umum
              </Link>
              .
            </p>
          </div>
          <Link href="/daftar" className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-800">
            Buat Akun Pendaftar
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d2a63] text-blue-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-6 px-4 py-10 text-sm">
          <div className="flex max-w-md items-start gap-3">
            <LogoTedc size={48} />
            <div>
              <p className="font-bold text-white">{KAMPUS.nama}</p>
              <p className="mt-1">{k.kampus.alamat}</p>
              <a href={KAMPUS.website} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[#f5c400] hover:underline">
                {KAMPUS.websiteLabel} ↗
              </a>
            </div>
          </div>
          <nav className="grid gap-1.5" aria-label="Tautan bawah">
            <Link href="/daftar" className="hover:text-white">Daftar akun</Link>
            <Link href="/masuk" className="hover:text-white">Masuk</Link>
            <Link href="/bantuan" className="hover:text-white">Bantuan &amp; FAQ</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

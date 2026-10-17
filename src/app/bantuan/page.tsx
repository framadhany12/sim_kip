import Link from "next/link";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { faq, pertanyaan, profilAdmin, users } from "@/db/schema";
import { kirimPertanyaan } from "@/app/actions/bantuan";
import { ActionForm, SubmitButton, TextArea } from "@/components/form";
import { Alert, Card, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { LINK_FORMAT_SURAT, MAX_UMUR, tahunLulusBoleh, tanggal } from "@/lib/constants";

export const metadata = { title: "Bantuan" };

const TIPS: { bagian: string; kolom: [string, string, string][] }[] = [
  {
    bagian: "Data Diri",
    kolom: [
      ["Nomor Pendaftaran KIP Kuliah", "Didapat setelah membuat akun di SIM KIP Kuliah (kip-kuliah.kemdiktisaintek.go.id). Daftar di sana terlebih dahulu.", "nomor dari akun SIM KIP Kuliah"],
      ["Desil", "Tingkat kesejahteraan keluarga dalam DTSEN. Cek di akun SIM KIP Kuliah atau dtsen-form.bps.go.id.", "Desil 2"],
      ["NISN", "10 digit, tertera di rapor/ijazah atau cek di nisn.data.kemdikbud.go.id.", "0061234567"],
      ["NIK", "16 digit di KTP atau KK. Jangan pakai spasi/titik.", "3277011201060001"],
      ["Nama lengkap", "Sama persis dengan Akta Kelahiran, tanpa singkatan.", "Muhammad Rizki Ramadhan"],
      ["Alamat lengkap", "Jalan/kampung, nomor rumah, patokan. RT/RW, desa, kecamatan, kabupaten diisi di kolom terpisah.", "Kp. Babakan No. 7, belakang SDN 2"],
      ["RT / RW", "Lihat di KK. Boleh ditulis 5 atau 005.", "005 / 003"],
      ["Kabupaten & kecamatan", "Pilih provinsi → kabupaten/kota → kecamatan dari daftar.", "Jawa Barat → Kota Cimahi → Cimahi Utara"],
    ],
  },
  {
    bagian: "Data Keluarga",
    kolom: [
      ["Nama ayah & ibu", "Wajib, sesuai KK — tetap diisi walau sudah meninggal.", "Ahmad Sutisna / Rina Marlina"],
      ["Nama wali", "Opsional; hanya bila tinggal bersama wali.", "Dedi Kurniawan (paman)"],
      ["HP/WA orang tua/wali", "Wajib. Nomor aktif yang bisa dihubungi kampus.", "081298765432"],
      ["Anggota keluarga serumah", "Semua yang tinggal serumah, termasuk Anda.", "5"],
    ],
  },
  {
    bagian: "Ekonomi Orang Tua",
    kolom: [
      ["Penghasilan per bulan", "Gabungan penghasilan orang tua/wali. Angka saja tanpa titik.", "1500000"],
      ["Tanggungan", "Jumlah orang yang dibiayai orang tua/wali, termasuk Anda.", "4"],
      ["Surat Keterangan Kebutuhan Ekonomi", "Opsional, mis. SKTM dari desa/kelurahan.", "SKTM Kelurahan Cibabat"],
    ],
  },
  {
    bagian: "Sekolah & Jurusan",
    kolom: [
      ["NPSN", "8 digit nomor sekolah; cek di referensi.data.kemdikbud.go.id.", "20224021"],
      ["Tahun lulus", `Hanya ${tahunLulusBoleh().join(", ")}.`, String(tahunLulusBoleh().at(-1))],
      ["Jurusan 1 & 2", "Pilih dua jurusan berbeda; Jurusan 1 adalah prioritas utama.", "D3 Teknik Mesin / D3 Teknik Otomotif"],
    ],
  },
];

// Pendaftar sudah punya wadah dari kerangka pendaftar, jadi tidak perlu <main> bersarang.
function Pembungkus({ className, children }: { className: string; children: React.ReactNode }) {
  return className.includes("max-w-5xl") ? <main id="konten" className={className}>{children}</main> : <div className={className}>{children}</div>;
}

export default async function BantuanPage() {
  const db = await getDb();
  const user = await getCurrentUser();
  const daftarFaq = await db.select().from(faq).orderBy(asc(faq.urutan));
  const pengelola = await db
    .select({ id: users.id, nama: users.nama, jabatan: profilAdmin.jabatan, whatsapp: profilAdmin.whatsapp, keterangan: profilAdmin.keterangan })
    .from(profilAdmin)
    .innerJoin(users, eq(users.id, profilAdmin.userId))
    .where(and(eq(profilAdmin.tampil, true), eq(users.role, "admin")))
    .orderBy(asc(users.nama));
  const milikSaya =
    user?.role === "pendaftar" ? await db.select().from(pertanyaan).where(eq(pertanyaan.userId, user.id)).orderBy(desc(pertanyaan.createdAt)) : [];

  return (
    <Pembungkus className={user?.role === "pendaftar" ? "space-y-8" : "mx-auto max-w-5xl space-y-8 px-4 py-8"}>
      <PageHeader
        title="Panduan & Bantuan"
        desc={`Syarat: lulusan SMA/SMK/MA atau sederajat tahun ${tahunLulusBoleh().join(", ")} dan berusia maksimal ${MAX_UMUR} tahun.`}
      />

      <section aria-labelledby="kontak-resmi" className="space-y-3">
        <div>
          <h2 id="kontak-resmi" className="text-lg font-bold text-slate-900">
            Kontak resmi pengelola KIP Kuliah
          </h2>
          <p className="text-sm text-slate-600">Hubungi hanya pengelola yang terdaftar di halaman ini untuk bertanya seputar pendaftaran.</p>
        </div>
        <Alert tone="warning" title="Waspada penipuan">
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            <li>
              Pendaftaran KIP Kuliah di Politeknik TEDC <b>tidak dipungut biaya apa pun</b>. Jangan transfer uang kepada siapa pun yang mengaku bisa &ldquo;meloloskan&rdquo; Anda.
            </li>
            <li>
              Pengelola <b>tidak pernah meminta kata sandi</b>, kode verifikasi, atau foto KTP/KK lewat chat. Unggah berkas hanya di website ini.
            </li>
            <li>Bila ada nomor lain yang menghubungi Anda, cocokkan dengan daftar resmi di bawah. Jika tidak ada di daftar, abaikan.</li>
          </ul>
        </Alert>
        {pengelola.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
            Daftar kontak belum ditampilkan. Sementara itu, kirim pertanyaan lewat menu <b>Tanya Admin</b> di bawah (setelah masuk sebagai pendaftar).
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {pengelola.map((p) => (
              <li key={p.id} className="flex gap-4 rounded-xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-900/5">
                <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#2563eb] to-[#0d2a63] text-base font-bold text-white">
                  {p.nama
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((s) => s[0]?.toUpperCase())
                    .join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 font-semibold text-slate-900">
                    {p.nama}
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-300">✓ Pengelola resmi</span>
                  </p>
                  <p className="text-sm text-slate-600">{p.jabatan}</p>
                  {p.keterangan && <p className="mt-1 text-[13px] text-slate-500">{p.keterangan}</p>}
                  {p.whatsapp && (
                    <a
                      href={`https://wa.me/${p.whatsapp}?text=${encodeURIComponent("Halo, saya calon pendaftar KIP Kuliah Politeknik TEDC Bandung. Saya ingin bertanya.")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                    >
                      WhatsApp +{p.whatsapp} ↗
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card title="Pertanyaan umum">
        <div className="divide-y divide-slate-100">
          {daftarFaq.map((f) => (
            <details key={f.id} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-slate-900">
                {f.pertanyaan}
                <span className="text-slate-400 transition group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-2 whitespace-pre-line text-[15px] text-slate-700">{f.jawaban}</p>
            </details>
          ))}
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Tips & contoh isian tiap kolom</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {TIPS.map((t) => (
            <Card key={t.bagian} title={t.bagian}>
              <dl className="space-y-3">
                {t.kolom.map(([k, tip, contoh]) => (
                  <div key={k}>
                    <dt className="text-sm font-semibold text-slate-900">{k}</dt>
                    <dd className="text-sm text-slate-600">
                      {tip} <span className="text-slate-500">Contoh:</span> <span className="font-mono text-[13px] text-slate-800">{contoh}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Format Surat Permohonan kepada Direktur:{" "}
          <a href={LINK_FORMAT_SURAT} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline">
            s.id/permohonandirektur-kiptedc ↗
          </a>
        </p>
      </section>

      <Card title="Tanya Admin">
        {user?.role === "pendaftar" ? (
          <div className="space-y-6">
            <ActionForm action={kirimPertanyaan} resetOnSuccess>
              <TextArea name="isi" label="Pertanyaan Anda" required rows={3} hint="Jelaskan bagian mana yang membingungkan." />
              <div className="flex justify-end">
                <SubmitButton>Kirim Pertanyaan</SubmitButton>
              </div>
            </ActionForm>
            {milikSaya.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Pertanyaan saya</h3>
                <ul className="space-y-3">
                  {milikSaya.map((q) => (
                    <li key={q.id} className="rounded-lg border border-slate-200 p-4">
                      <p className="whitespace-pre-line text-[15px] text-slate-900">{q.isi}</p>
                      <p className="mt-1 text-xs text-slate-500">{tanggal(q.createdAt)}</p>
                      {q.jawaban ? (
                        <div className="mt-3 rounded-md bg-blue-50 p-3 text-sm text-slate-800">
                          <p className="text-xs font-semibold text-blue-800">Jawaban admin · {tanggal(q.answeredAt)}</p>
                          <p className="mt-1 whitespace-pre-line">{q.jawaban}</p>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-amber-700">Menunggu jawaban admin</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            <Link href="/masuk" className="font-semibold text-blue-700 hover:underline">
              Masuk
            </Link>{" "}
            sebagai pendaftar untuk mengirim pertanyaan langsung ke admin.
          </p>
        )}
      </Card>
    </Pembungkus>
  );
}

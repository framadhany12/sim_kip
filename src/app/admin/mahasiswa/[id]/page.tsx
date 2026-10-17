import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { ArrowLeft, CheckCircle2, ExternalLink, MailWarning } from "lucide-react";
import { getDb } from "@/db";
import { jurusan, sumberRekomendasi, users, wilayahKabupaten } from "@/db/schema";
import { aturAktifAkun } from "@/app/actions/pengguna";
import { FormAktif } from "@/components/admin/form-aktif";
import { aturSandiPendaftar, simpanAkunPendaftar, simpanBagianPendaftar, type BagianEdit } from "@/app/actions/mahasiswa";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { FormSandi } from "@/components/admin/form-sandi";
import { FieldsDataDiri, FieldsEkonomi, FieldsKeluarga, FieldsSekolah } from "@/components/pendaftaran-fields";
import { RekomendasiFields } from "@/components/rekomendasi-fields";
import { RingkasanData } from "@/components/ringkasan-data";
import { Riwayat } from "@/components/riwayat";
import { Alert, Card, StatusBadge } from "@/components/ui";
import { tanggal } from "@/lib/constants";
import { cariPendaftaranUser, muatLengkap } from "@/lib/pendaftaran";

export const metadata = { title: "Detail Mahasiswa" };

const TAB = [
  ["ringkasan", "Ringkasan"],
  ["akun", "Akun"],
  ["data-diri", "Data Diri"],
  ["keluarga", "Keluarga"],
  ["ekonomi", "Ekonomi"],
  ["sekolah", "Sekolah & Jurusan"],
  ["rekomendasi", "Rekomendasi"],
  ["sandi", "Kata Sandi"],
  ["status", "Status Akun"],
] as const;
type SlugTab = (typeof TAB)[number][0];

function Simpan({ catatan = true }: { catatan?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
      <p className="text-[13px] text-slate-500">{catatan ? "Perubahan tercatat di riwayat pendaftar sebagai tindakan admin." : ""}</p>
      <SubmitButton>Simpan Perubahan</SubmitButton>
    </div>
  );
}

export default async function DetailMahasiswa({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const tab: SlugTab = TAB.some(([s]) => s === sp.tab) ? (sp.tab as SlugTab) : "ringkasan";
  const db = await getDb();
  const [u] = await db.select().from(users).where(and(eq(users.id, id), eq(users.role, "pendaftar")));
  if (!u) notFound();
  const pend = await cariPendaftaranUser(id);
  const d = pend ? await muatLengkap(pend.id) : null;
  const edit = (b: BagianEdit) => simpanBagianPendaftar.bind(null, b, id);

  return (
    <div className="space-y-5">
      <Link href="/admin/mahasiswa" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="size-4" aria-hidden /> Master Calon Mahasiswa
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{d?.diri?.namaLengkap ?? u.nama}</h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <span className="break-all">{u.email}</span>
            {u.emailVerifiedAt ? (
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="size-4" aria-hidden /> Email terverifikasi
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-700">
                <MailWarning className="size-4" aria-hidden /> Email belum terverifikasi
              </span>
            )}
            <span>Mendaftar {tanggal(u.createdAt)}</span>
            {!u.aktif && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-800 ring-1 ring-rose-300">Akun nonaktif</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {d ? <StatusBadge status={d.status} tahap={d.tahap} usulan={d.usulan} /> : <span className="text-sm text-slate-500">Belum membuka formulir</span>}
          {pend && (
            <Link href={`/admin/pendaftar/${pend.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
              Berkas & status seleksi <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          )}
        </div>
      </div>

      <nav aria-label="Bagian data" className="-mx-1 flex gap-1 overflow-x-auto border-b border-slate-200 px-1">
        {TAB.map(([slug, label]) => (
          <Link
            key={slug}
            href={`/admin/mahasiswa/${id}?tab=${slug}`}
            aria-current={tab === slug ? "page" : undefined}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${
              tab === slug ? "border-blue-700 text-blue-800" : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === "ringkasan" &&
        (d ? (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <RingkasanData d={d} />
            <Card title="Riwayat">
              <Riwayat items={d.riwayat} />
            </Card>
          </div>
        ) : (
          <Alert tone="info" title="Belum ada data formulir">
            Akun ini baru dibuat dan belum membuka formulir pendaftaran. Anda tetap bisa mengisi datanya lewat tab-tab di atas.
          </Alert>
        ))}

      {tab === "akun" && (
        <Card title="Data akun">
          <ActionForm action={simpanAkunPendaftar.bind(null, id)}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field name="nama" label="Nama akun" required defaultValue={u.nama} hint="Nama saat membuat akun; nama lengkap pendaftar ada di tab Data Diri." />
              <Field name="email" type="email" label="Email (untuk masuk)" required defaultValue={u.email} hint="Mengubah email mengeluarkan pendaftar dari semua perangkat." />
            </div>
            <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
              <input type="checkbox" name="terverifikasi" defaultChecked={!!u.emailVerifiedAt} className="mt-0.5 size-4 accent-blue-700" />
              <span>
                <b className="block text-slate-900">Email terverifikasi</b>
                Centang bila Anda sudah memastikan email ini milik pendaftar (mis. pendaftar tidak menerima email verifikasi). Pendaftar baru bisa masuk setelah email terverifikasi.
              </span>
            </label>
            <Simpan />
          </ActionForm>
        </Card>
      )}

      {tab === "data-diri" && (
        <Card title="Data Diri">
          <ActionForm action={edit("diri")}>
            <FieldsDataDiri
              x={d?.diri ?? null}
              namaBawaan={u.nama}
              kabupaten={await db.select().from(wilayahKabupaten).orderBy(asc(wilayahKabupaten.nama))}
              admin
            />
            <Simpan />
          </ActionForm>
        </Card>
      )}

      {tab === "keluarga" && (
        <Card title="Data Keluarga">
          <ActionForm action={edit("keluarga")}>
            <FieldsKeluarga x={d?.keluarga ?? null} admin />
            <Simpan />
          </ActionForm>
        </Card>
      )}

      {tab === "ekonomi" && (
        <Card title="Ekonomi Orang Tua/Wali">
          <ActionForm action={edit("ekonomi")}>
            <FieldsEkonomi x={d?.ekonomi ?? null} admin />
            <Simpan />
          </ActionForm>
          {pend && (
            <p className="mt-4 text-[13px] text-slate-500">
              Berkas (termasuk Surat Keterangan Kebutuhan Ekonomi) dilihat dan diverifikasi di{" "}
              <Link href={`/admin/pendaftar/${pend.id}`} className="font-semibold text-blue-700 hover:underline">
                halaman berkas & status seleksi
              </Link>
              .
            </p>
          )}
        </Card>
      )}

      {tab === "sekolah" &&
        (await (async () => {
          const aktif = await db.select().from(jurusan).where(eq(jurusan.aktif, true)).orderBy(asc(jurusan.nama));
          const opsi = aktif.map((j) => ({ value: j.id, label: j.nama }));
          return (
            <Card title="Data Sekolah & Pilihan Jurusan">
              <ActionForm action={edit("sekolah")}>
                <FieldsSekolah s={d?.sekolah ?? null} pilihan={d?.pilihan ?? null} jurusan={{ mode: "edit", opsi1: opsi, opsi2: opsi }} admin />
                <Simpan />
              </ActionForm>
            </Card>
          );
        })())}

      {tab === "rekomendasi" &&
        (await (async () => {
          const semua = await db.select().from(sumberRekomendasi).orderBy(asc(sumberRekomendasi.urutan), asc(sumberRekomendasi.nama));
          const r = d?.rekomendasi;
          const sumber = semua.filter((s) => s.aktif || s.id === r?.sumberId).map((s) => ({ id: s.id, nama: s.aktif ? s.nama : `${s.nama} (nonaktif)`, butuhKontak: s.butuhKontak }));
          return (
            <Card title="Rekomendasi">
              {sumber.length === 0 ? (
                <Alert tone="warning">Belum ada pilihan sumber rekomendasi. Tambahkan lewat menu Sumber Rekomendasi.</Alert>
              ) : (
                <ActionForm action={edit("rekomendasi")}>
                  <RekomendasiFields sumber={sumber} defaultSumber={r?.sumberId} defaultNama={r?.namaPerekomendasi} defaultTelepon={r?.teleponPerekomendasi} />
                  <Simpan />
                </ActionForm>
              )}
            </Card>
          );
        })())}

      {tab === "status" && (
        <Card title="Status akun">
          <FormAktif nama={d?.diri?.namaLengkap ?? u.nama} aktif={u.aktif} action={aturAktifAkun.bind(null, id)} />
        </Card>
      )}

      {tab === "sandi" && (
        <Card title="Kata sandi">
          <FormSandi nama={d?.diri?.namaLengkap ?? u.nama} action={aturSandiPendaftar.bind(null, id)} />
        </Card>
      )}
    </div>
  );
}

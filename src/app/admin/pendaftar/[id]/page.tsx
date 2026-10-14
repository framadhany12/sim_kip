import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { jurusan } from "@/db/schema";
import { perbaruiTahap, ubahJurusanPendaftar, verifikasiBerkas } from "@/app/actions/admin";
import { ActionForm, Select, SubmitButton } from "@/components/form";
import { FormTahapFields } from "@/components/form-tahap";
import { RingkasanData } from "@/components/ringkasan-data";
import { Riwayat } from "@/components/riwayat";
import { Alert, Card, Dl, StatusBadge } from "@/components/ui";
import { BERKAS_INFO, JENIS_URUT, MAX_UMUR, hitungUmur, tanggal } from "@/lib/constants";
import { cekKelengkapan, muatLengkap } from "@/lib/pendaftaran";

export const metadata = { title: "Detail Pendaftar" };

const VERIF_BTN = [
  { status: "valid", label: "Valid", on: "bg-emerald-700 text-white", off: "text-emerald-800 ring-emerald-300 hover:bg-emerald-50" },
  { status: "tidak_valid", label: "Tidak valid", on: "bg-rose-700 text-white", off: "text-rose-800 ring-rose-300 hover:bg-rose-50" },
] as const;

export default async function DetailPendaftar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [d, daftarJurusan] = await Promise.all([
    muatLengkap(id),
    getDb().then((db) => db.select({ id: jurusan.id, nama: jurusan.nama }).from(jurusan).where(eq(jurusan.aktif, true)).orderBy(asc(jurusan.nama))),
  ]);
  if (!d) notFound();
  const cek = cekKelengkapan(d);
  const umur = d.diri ? hitungUmur(d.diri.tanggalLahir) : null;
  const dikirim = d.status !== "draft";

  const berkasSlot = (
    <ul className="grid gap-3 sm:grid-cols-2">
      {JENIS_URUT.map((j) => {
        const b = d.berkas[j];
        const url = b && `/api/berkas/${b.id}`;
        return (
          <li key={j} className="rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-900">
              {BERKAS_INFO[j].label}
              {!BERKAS_INFO[j].wajib && <span className="font-normal text-slate-500"> (opsional)</span>}
            </p>
            {b ? (
              <>
                <a href={url} target="_blank" rel="noreferrer" className="mt-2 block overflow-hidden rounded-md border border-slate-200 bg-slate-50 hover:ring-2 hover:ring-blue-600/30">
                  {b.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={BERKAS_INFO[j].label} className="h-40 w-full object-contain" />
                  ) : (
                    <span className="grid h-40 place-items-center text-sm font-semibold text-rose-700">PDF — klik untuk membuka ↗</span>
                  )}
                </a>
                <p className="mt-1.5 truncate text-xs text-slate-500">
                  {b.namaAsli} · {tanggal(b.uploadedAt)}
                </p>
                <div className="mt-2 flex gap-2">
                  {VERIF_BTN.map((v) => (
                    <form key={v.status} action={verifikasiBerkas}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="status" value={b.statusVerifikasi === v.status ? "menunggu" : v.status} />
                      <button
                        aria-pressed={b.statusVerifikasi === v.status}
                        className={`rounded-md px-3 py-1 text-xs font-semibold ring-1 ring-inset ${b.statusVerifikasi === v.status ? v.on + " ring-transparent" : v.off}`}
                      >
                        {b.statusVerifikasi === v.status ? "✓ " : ""}
                        {v.label}
                      </button>
                    </form>
                  ))}
                </div>
              </>
            ) : (
              <p className={`mt-2 text-sm ${BERKAS_INFO[j].wajib ? "text-amber-700" : "text-slate-400"}`}>Belum diunggah</p>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="space-y-5">
      <Link href="/admin/pendaftar" className="text-sm font-medium text-slate-600 hover:text-slate-900">
        ← Daftar pendaftar
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{d.diri?.namaLengkap ?? d.user.nama}</h1>
        <StatusBadge status={d.status} tahap={d.tahap} />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {(umur !== null && umur > MAX_UMUR) || cek.masalah.length > 0 ? (
            <Alert tone="warning" title="Perhatian">
              <ul className="list-disc pl-4">
                {cek.masalah.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </Alert>
          ) : null}
          <RingkasanData d={d} berkasSlot={berkasSlot} />
        </div>

        <div className="space-y-4 lg:sticky lg:top-20">
          <Card title="Status seleksi">
            <Dl
              items={[
                ["Akun", d.user.email],
                ["Gelombang", d.gelombang],
                ["Dikirim", tanggal(d.submittedAt)],
                ...(d.jurusanDiterima ? ([["Diterima di", d.jurusanDiterima]] as [string, string][]) : []),
              ]}
            />
            <div className="mt-4 border-t border-slate-100 pt-4">
              {!dikirim ? (
                <p className="text-sm text-slate-600">Pendaftar belum mengirim formulir. Status seleksi dapat diatur setelah dikirim.</p>
              ) : (
                <ActionForm action={perbaruiTahap.bind(null, d.id)} className="space-y-3">
                  <FormTahapFields
                    tahapSaatIni={d.tahap}
                    hasilSaatIni={d.hasil}
                    jurusanDiterimaId={d.jurusanDiterimaId}
                    catatanSaatIni={d.catatanAdmin}
                    pilihan={
                      d.pilihan
                        ? [
                            { id: d.pilihan.jurusan1Id, label: `Jurusan 1 — ${d.pilihan.jurusan1}` },
                            { id: d.pilihan.jurusan2Id, label: `Jurusan 2 — ${d.pilihan.jurusan2}` },
                          ]
                        : []
                    }
                  />
                </ActionForm>
              )}
            </div>
          </Card>
          <Card title="Pilihan jurusan">
            <p className="mb-3 text-[13px] text-slate-500">
              Setelah pendaftaran dikirim, hanya admin yang dapat mengubah pilihan jurusan. Perubahan tercatat di riwayat dan terlihat oleh pendaftar.
            </p>
            {daftarJurusan.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada jurusan aktif.</p>
            ) : (
              <ActionForm action={ubahJurusanPendaftar.bind(null, d.id)} className="space-y-3">
                <Select
                  name="jurusan1Id"
                  label="Jurusan 1"
                  required
                  defaultValue={d.pilihan?.jurusan1Id}
                  options={daftarJurusan.map((j) => ({ value: j.id, label: j.nama }))}
                />
                <Select
                  name="jurusan2Id"
                  label="Jurusan 2"
                  required
                  defaultValue={d.pilihan?.jurusan2Id}
                  options={daftarJurusan.map((j) => ({ value: j.id, label: j.nama }))}
                />
                <SubmitButton variant="secondary" className="w-full">
                  Simpan Pilihan Jurusan
                </SubmitButton>
              </ActionForm>
            )}
          </Card>
          <Card title="Riwayat">
            <Riwayat items={d.riwayat} />
          </Card>
        </div>
      </div>
    </div>
  );
}

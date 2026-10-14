import Link from "next/link";
import { ProsesSeleksi } from "@/components/proses-seleksi";
import { Riwayat } from "@/components/riwayat";
import { Hero } from "@/components/hero";
import { Alert, Card, Dl, StatusBadge } from "@/components/ui";
import { TAHAP_LABEL, tanggal } from "@/lib/constants";
import { konteksPendaftar } from "@/lib/konteks";

export const metadata = { title: "Status Pendaftaran" };

export default async function StatusPage({ searchParams }: { searchParams: Promise<{ terkirim?: string }> }) {
  const { d, sudahDikirim } = await konteksPendaftar();
  const { terkirim } = await searchParams;
  const diumumkan = d.tahap === "pengumuman" && !!d.hasil;
  const gugur = d.hasil === "ditolak" && !!d.tahap && d.tahap !== "pengumuman";

  return (
    <div className="space-y-6">
      <Hero eyebrow="Pendaftaran KIP Kuliah" title="Status Pendaftaran" desc="Pantau sampai mana proses seleksi Anda, catatan dari admin, dan hasil akhir seleksi." />
      {terkirim && (
        <Alert tone="success" title="Pendaftaran berhasil dikirim">
          Terima kasih. Pendaftaran Anda sekarang masuk tahap Seleksi Administrasi.
        </Alert>
      )}

      <Card title="Proses seleksi" action={<StatusBadge status={d.status} tahap={d.tahap} />}>
        <ProsesSeleksi
          status={d.status}
          tahap={d.tahap}
          hasil={d.hasil}
          jurusanDiterima={d.jurusanDiterima}
          alasan={d.alasanDitolak}
          submittedAt={d.submittedAt}
          riwayat={d.riwayat}
        />
      </Card>

      {gugur && (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-5 sm:p-6" aria-label="Hasil seleksi">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Hasil {TAHAP_LABEL[d.tahap!]}</p>
          <p className="mt-1 text-xl font-bold text-rose-800 sm:text-2xl">✕ TIDAK LOLOS {TAHAP_LABEL[d.tahap!].toUpperCase()}</p>
          {d.alasanDitolak && (
            <p className="mt-2 text-[15px] text-slate-800">
              Alasan: <b>{d.alasanDitolak}</b>
            </p>
          )}
        </section>
      )}

      {diumumkan && (
        <section
          className={`rounded-xl border p-5 sm:p-6 ${d.hasil === "diterima" ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}
          aria-label="Pengumuman hasil seleksi"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Pengumuman hasil seleksi</p>
          <p className={`mt-1 text-xl font-bold sm:text-2xl ${d.hasil === "diterima" ? "text-emerald-800" : "text-rose-800"}`}>
            {d.hasil === "diterima" ? "✓ DITERIMA sebagai penerima KIP Kuliah" : "✕ TIDAK DITERIMA"}
          </p>
          {d.hasil === "ditolak" && d.alasanDitolak && (
            <p className="mt-2 text-[15px] text-slate-800">
              Alasan: <b>{d.alasanDitolak}</b>
            </p>
          )}
          {d.hasil === "diterima" && d.jurusanDiterima && (
            <p className="mt-2 text-[15px] text-slate-800">
              Program studi: <b className="text-lg text-emerald-900">{d.jurusanDiterima}</b>
            </p>
          )}
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <Card title="Catatan dari admin">
            {d.catatanAdmin ? (
              <>
                {d.tahap && sudahDikirim && <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{TAHAP_LABEL[d.tahap]}</p>}
                <p className="whitespace-pre-line text-[15px] text-slate-800">{d.catatanAdmin}</p>
              </>
            ) : (
              <p className="text-sm text-slate-500">Belum ada catatan.</p>
            )}
          </Card>
          <Card title="Data pendaftaran">
            <Dl
              items={[
                ["Dikirim", tanggal(d.submittedAt)],
                ["Pembaruan terakhir", tanggal(d.updatedAt)],
              ]}
            />
            {!sudahDikirim ? (
              <p className="mt-4 text-sm text-slate-600">
                Pendaftaran belum dikirim.{" "}
                <Link href="/formulir/ringkasan" className="font-semibold text-blue-700 hover:underline">
                  Lengkapi & kirim →
                </Link>
              </p>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Perlu memperbarui data atau berkas?{" "}
                <Link href="/formulir/ringkasan" className="font-semibold text-blue-700 hover:underline">
                  Perbarui di sini →
                </Link>
              </p>
            )}
          </Card>
        </div>
        <Card title="Riwayat pendaftaran">
          <Riwayat items={d.riwayat} />
        </Card>
      </div>
    </div>
  );
}

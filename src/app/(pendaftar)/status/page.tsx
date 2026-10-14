import Link from "next/link";
import { Riwayat } from "@/components/riwayat";
import { Alert, Card, Dl, PageHeader, StatusBadge } from "@/components/ui";
import { tahapan, tanggal } from "@/lib/constants";
import { konteksPendaftar } from "@/lib/konteks";

export const metadata = { title: "Status Pendaftaran" };

export default async function StatusPage({ searchParams }: { searchParams: Promise<{ terkirim?: string }> }) {
  const { d } = await konteksPendaftar();
  const { terkirim } = await searchParams;
  const tahap = tahapan(d.status);

  return (
    <div className="space-y-6">
      <PageHeader title="Status Pendaftaran" desc="Pantau tahapan, catatan admin, dan hasil akhir seleksi Anda di sini." />
      {terkirim && (
        <Alert tone="success" title="Pendaftaran berhasil dikirim">
          Terima kasih. Data Anda sekarang sedang diperiksa oleh admin.
        </Alert>
      )}

      {tahap === 2 && (
        <section
          className={`rounded-xl border p-6 ${d.status === "diterima" ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}
          aria-label="Hasil akhir seleksi"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Hasil akhir seleksi</p>
          <p className={`mt-1 text-2xl font-bold ${d.status === "diterima" ? "text-emerald-800" : "text-rose-800"}`}>
            {d.status === "diterima" ? "✓ DITERIMA sebagai penerima KIP Kuliah" : "✕ TIDAK DITERIMA"}
          </p>
          {d.catatanAdmin && <p className="mt-2 whitespace-pre-line text-[15px] text-slate-800">{d.catatanAdmin}</p>}
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <Card title="Status terkini" action={<StatusBadge status={d.status} />}>
            <Dl
              items={[
                ["Gelombang", d.gelombang],
                ["Dikirim", tanggal(d.submittedAt)],
                ["Pembaruan terakhir", tanggal(d.updatedAt)],
              ]}
            />
            {d.status === "draft" && (
              <p className="mt-4 text-sm text-slate-600">
                Pendaftaran belum dikirim.{" "}
                <Link href="/formulir/ringkasan" className="font-semibold text-blue-700 hover:underline">
                  Lengkapi & kirim →
                </Link>
              </p>
            )}
          </Card>
          <Card title="Catatan dari admin">
            {d.catatanAdmin && tahap !== 2 ? (
              <>
                <p className="whitespace-pre-line text-[15px] text-slate-800">{d.catatanAdmin}</p>
                {d.status === "perbaikan" && (
                  <Link href="/formulir/data-diri" className="mt-4 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
                    Perbaiki Sekarang →
                  </Link>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">{tahap === 2 && d.catatanAdmin ? "Lihat catatan pada hasil akhir di atas." : "Belum ada catatan."}</p>
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

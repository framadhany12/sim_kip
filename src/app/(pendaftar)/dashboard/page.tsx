import Link from "next/link";
import { Alert, ButtonLink, Card, StatusBadge } from "@/components/ui";
import { LANGKAH, STATUS_LABEL, tahapan, tanggal } from "@/lib/constants";
import { konteksPendaftar } from "@/lib/konteks";

export const metadata = { title: "Beranda" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ terverifikasi?: string }> }) {
  const { user, d, cek, editable } = await konteksPendaftar();
  const { terverifikasi } = await searchParams;
  const berikutnya = LANGKAH.find((l) => !cek.langkah[l.slug]) ?? LANGKAH[LANGKAH.length - 1];
  const tahap = tahapan(d.status);

  return (
    <div className="space-y-6">
      {terverifikasi && (
        <Alert tone="success" title="Email terverifikasi, akun aktif 🎉">
          Langkah pertama selesai. Lanjutkan dengan mengisi formulir pendaftaran.
        </Alert>
      )}
      <div>
        <p className="text-sm text-slate-500">{d.gelombang}</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Halo, {user.nama.split(" ")[0]}!</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Card title="Pendaftaran Anda" action={<StatusBadge status={d.status} />}>
          {editable ? (
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
              <p className="text-[15px] text-slate-700">
                {tahap === 1
                  ? "Pendaftaran Anda sudah terkirim dan sedang diperiksa oleh admin. Kami akan memperbarui status di sini."
                  : d.status === "diterima"
                    ? "Selamat! Pendaftaran KIP Kuliah Anda dinyatakan diterima."
                    : "Mohon maaf, pendaftaran KIP Kuliah Anda belum dapat diterima."}
              </p>
              <p className="mt-2 text-sm text-slate-500">Dikirim: {tanggal(d.submittedAt)}</p>
              <div className="mt-5">
                <ButtonLink href="/status">Lihat Detail Status →</ButtonLink>
              </div>
            </>
          )}
        </Card>

        <Card title="Tahapan">
          <ol className="space-y-3">
            {["Belum dikirim", "Sedang diperiksa", "Selesai"].map((t, i) => (
              <li key={t} className="flex items-center gap-3">
                <span
                  className={`grid size-7 place-items-center rounded-full text-xs font-bold ${
                    i < tahap ? "bg-emerald-600 text-white" : i === tahap ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {i < tahap ? "✓" : i + 1}
                </span>
                <span className={`text-sm ${i === tahap ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                  {t}
                  {i === tahap && <span className="block text-xs font-normal text-slate-500">{STATUS_LABEL[d.status]}</span>}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-600">
            Bingung mengisi?{" "}
            <Link href="/bantuan" className="font-semibold text-blue-700 hover:underline">
              Buka Bantuan
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

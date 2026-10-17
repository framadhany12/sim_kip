/**
 * Kerangka yang tampil seketika setelah menu diklik, sampai isi halaman dari server siap.
 * Kelas `muat-tunda` menahannya 120 ms agar perpindahan yang cepat tidak berkedip.
 */
export function KerangkaMuat({ judul = true, baris = 5 }: { judul?: boolean; baris?: number }) {
  return (
    <div role="status" className="muat-tunda">
      <span className="sr-only">Memuat halaman…</span>
      <div aria-hidden className="motion-safe:animate-pulse">
        {judul && (
          <div className="mb-6">
            <div className="h-7 w-56 max-w-full rounded-lg bg-slate-200" />
            <div className="mt-2.5 h-4 w-96 max-w-full rounded bg-slate-200/70" />
          </div>
        )}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="mt-5 space-y-3.5">
            {Array.from({ length: baris }, (_, i) => (
              <div key={i} className="h-4 rounded bg-slate-100" style={{ width: `${92 - (i % 3) * 14}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

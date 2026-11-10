import { TAHAP, type Status, type Tahap } from "@/db/schema";
import { TAHAP_DESKRIPSI, TAHAP_LABEL, tanggal } from "@/lib/constants";

type Props = {
  status: Status;
  tahap: Tahap | null;
  hasil: "diterima" | "ditolak" | null;
  jurusanDiterima: string | null;
  /** Alasan tidak lolos (gugur sebelum Pengumuman) atau tidak diterima (Pengumuman). */
  alasan?: string | null;
  submittedAt: Date | null;
  riwayat: { status: string; createdAt: Date }[];
  /** Tampilan ringkas (kartu sempit di dashboard): tanpa deskripsi tahap. */
  ringkas?: boolean;
};

/** Alur seleksi yang dilihat pendaftar: Pendaftaran → 5 tahap seleksi, dengan tanda selesai / sedang berjalan. */
export function ProsesSeleksi({ status, tahap, hasil, jurusanDiterima, alasan, submittedAt, riwayat, ringkas }: Props) {
  const dikirim = !(status === "draft" || status === "perbaikan");
  // Indeks langkah aktif: 0 = pendaftaran, 1..5 = tahap seleksi.
  const aktif = !dikirim ? 0 : 1 + Math.max(0, TAHAP.indexOf(tahap ?? "administrasi"));
  const selesaiSemua = tahap === "pengumuman" && !!hasil;
  // Gugur sebelum Pengumuman (mis. tidak lolos Seleksi Administrasi): proses berhenti di tahap itu.
  const gugur = hasil === "ditolak" && tahap !== "pengumuman";
  // Tanggal pertama kali masuk tiap tahap, dari riwayat (riwayat diurutkan terbaru dulu).
  const masuk = (key: string) => [...riwayat].reverse().find((r) => r.status === key)?.createdAt;

  const langkah = [
    {
      label: "Pendaftaran",
      ket: dikirim ? `Dikirim ${tanggal(submittedAt, false)}` : status === "perbaikan" ? "Perlu perbaikan, kirim ulang" : "Lengkapi dan kirim formulir",
      desk: "Isi formulir, unggah berkas, lalu kirim.",
    },
    ...TAHAP.map((t) => {
      const tgl = t === "pengumuman" ? masuk("diterima") ?? masuk("ditolak") : masuk(t) ?? masuk(`tidak_lolos:${t}`) ?? masuk(`lolos:${t}`);
      return { label: TAHAP_LABEL[t], ket: tgl ? tanggal(tgl, false) : "", desk: TAHAP_DESKRIPSI[t] };
    }),
  ];

  return (
    <ol className={ringkas ? "space-y-0" : "grid gap-0 md:grid-cols-6 md:gap-2"}>
      {langkah.map((l, i) => {
        const done = i < aktif || (i === aktif && selesaiSemua) || (i === 0 && dikirim);
        const now = i === aktif && !done && !gugur;
        const terakhir = i === langkah.length - 1;
        const hasilAkhir = (terakhir && selesaiSemua) || (gugur && i === aktif);
        const warnaBulatan = hasilAkhir
          ? hasil === "diterima"
            ? "bg-emerald-600 text-white"
            : "bg-rose-600 text-white"
          : done
            ? "bg-emerald-600 text-white"
            : now
              ? "bg-blue-700 text-white ring-4 ring-blue-100"
              : "bg-slate-100 text-slate-500 ring-1 ring-slate-200";
        return (
          <li key={l.label} className={`relative flex gap-3 ${ringkas ? "pb-4 last:pb-0" : "pb-5 md:flex-col md:gap-2 md:pb-0"}`}>
            {/* garis penghubung */}
            {!terakhir && (
              <span
                aria-hidden
                className={`absolute ${ringkas ? "left-[13px] top-8 bottom-0 w-0.5" : "left-[13px] top-8 bottom-0 w-0.5 md:left-9 md:right-0 md:top-[13px] md:bottom-auto md:h-0.5 md:w-auto"} ${
                  done ? "bg-emerald-500" : "bg-slate-200"
                }`}
              />
            )}
            <span className={`relative z-10 grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${warnaBulatan}`}>
              {hasilAkhir ? (hasil === "diterima" ? "✓" : "✕") : done ? "✓" : i}
            </span>
            <div className="min-w-0">
              <p className={`text-sm leading-tight ${now ? "font-bold text-blue-900" : done ? "font-semibold text-slate-900" : "text-slate-500"}`}>{l.label}</p>
              {now && <p className="mt-0.5 text-xs font-semibold text-blue-700">Sedang berlangsung</p>}
              {hasilAkhir && (
                <p className={`mt-0.5 text-xs font-semibold ${hasil === "diterima" ? "text-emerald-700" : "text-rose-700"}`}>
                  {hasil === "diterima"
                    ? `Diterima${jurusanDiterima ? ` — ${jurusanDiterima}` : ""}`
                    : gugur
                      ? `Tidak lolos${alasan ? ` — ${alasan}` : ""}`
                      : `Tidak diterima${alasan ? ` — ${alasan}` : ""}`}
                </p>
              )}
              {l.ket && !now && <p className="mt-0.5 text-xs text-slate-500">{l.ket}</p>}
              {!ringkas && now && <p className="mt-1 text-xs leading-snug text-slate-600">{l.desk}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

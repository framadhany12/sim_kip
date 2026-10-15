import Link from "next/link";
import { Megaphone } from "lucide-react";
import { umumkanMassal } from "@/app/actions/admin";
import { FormPengumuman } from "@/components/admin/form-pengumuman";
import { Alert, PageHeader } from "@/components/ui";
import { ALASAN_TIDAK_DITERIMA, ALASAN_TIDAK_LOLOS_ADMINISTRASI, TAHAP_LABEL } from "@/lib/constants";
import { daftarTahun } from "@/lib/admin-query";
import { BATAS_KANDIDAT, JENIS_LANJUT, JENIS_PENGUMUMAN, kandidatPengumuman, TAHAP_BAWAAN, type JenisPengumuman } from "@/lib/pengumuman";
import { inputCls } from "@/lib/styles";
import { parseTahun, SEMUA_TAHUN, tahunBerjalan } from "@/lib/tahun";
import { getDb } from "@/db";
import { jenisBeasiswa, TAHAP } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const metadata = { title: "Pengumuman" };

const MODE: Record<JenisPengumuman, { judul: string; deskripsi: string }> = {
  lolos_administrasi: {
    judul: "Lolos administrasi",
    deskripsi: "Pendaftar yang masih di Seleksi Administrasi dan dinyatakan lolos. Mereka otomatis masuk Seleksi Ujian.",
  },
  selesai_ujian: {
    judul: "Sudah ujian",
    deskripsi: "Pendaftar yang sedang di Seleksi Ujian dan sudah mengikuti ujian. Mereka otomatis masuk Seleksi Wawancara.",
  },
  selesai_wawancara: {
    judul: "Sudah wawancara",
    deskripsi: "Pendaftar yang sedang di Seleksi Wawancara dan sudah mengikuti wawancara. Mereka otomatis masuk tahap Pengusulan.",
  },
  administrasi: {
    judul: "Tidak lolos administrasi",
    deskripsi: "Pendaftar yang masih di Seleksi Administrasi dan dinyatakan tidak lolos. Proses seleksi mereka berhenti di tahap ini.",
  },
  ditolak: {
    judul: "Tidak diterima",
    deskripsi: "Pengumuman akhir untuk pendaftar yang tidak diterima. Pilih satu alasan yang berlaku untuk semua yang dicentang.",
  },
  diterima: {
    judul: "Diterima",
    deskripsi: "Pengumuman akhir untuk pendaftar yang diterima. Setiap pendaftar harus diberi jurusan, yaitu Jurusan 1 atau Jurusan 2 pilihannya.",
  },
};

type Params = { jenis?: string; tahap?: string; tahun?: string; q?: string };

export default async function PengumumanPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const jenis = (JENIS_PENGUMUMAN as readonly string[]).includes(sp.jenis ?? "") ? (sp.jenis as JenisPengumuman) : "lolos_administrasi";
  const [{ rows, terpotong }, pilihanTahun, beasiswa] = await Promise.all([
    kandidatPengumuman({ jenis, tahap: sp.tahap, tahun: sp.tahun, q: sp.q }),
    daftarTahun(),
    getDb().then((db) =>
      db
        .select({ id: jenisBeasiswa.id, nama: jenisBeasiswa.nama })
        .from(jenisBeasiswa)
        .where(eq(jenisBeasiswa.aktif, true))
        .orderBy(asc(jenisBeasiswa.urutan), asc(jenisBeasiswa.nama)),
    ),
  ]);
  const tahapDipilih = sp.tahap ?? TAHAP_BAWAAN;
  const tahunDipilih = sp.tahun ?? String(tahunBerjalan());
  const keTab = (j: JenisPengumuman) => {
    const p = new URLSearchParams();
    p.set("jenis", j);
    if (sp.tahun) p.set("tahun", sp.tahun);
    return `/admin/pengumuman?${p.toString()}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pengumuman"
        desc="Umumkan hasil dan majukan tahap seleksi untuk banyak pendaftar sekaligus: centang nama-namanya, lalu umumkan. Hasil langsung terlihat oleh pendaftar di halaman Status."
      />

      <div role="tablist" aria-label="Jenis pengumuman" className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {JENIS_PENGUMUMAN.map((j) => (
          <Link
            key={j}
            href={keTab(j)}
            role="tab"
            aria-selected={jenis === j}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              jenis === j
                ? j === "diterima"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : JENIS_LANJUT[j]
                    ? "bg-blue-700 text-white shadow-sm"
                    : "bg-rose-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {MODE[j].judul}
          </Link>
        ))}
      </div>

      <p className="flex items-start gap-2 text-sm text-slate-600">
        <Megaphone className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
        {MODE[jenis].deskripsi}
      </p>

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]">
        <input type="hidden" name="jenis" value={jenis} />
        <div>
          <label htmlFor="q" className="mb-1 block text-xs font-medium text-slate-600">
            Cari nama, NIK, NISN, No. KIP, atau sekolah
          </label>
          <input id="q" name="q" defaultValue={sp.q} placeholder="mis. Siti / SMKN 1" className={inputCls} />
        </div>
        {JENIS_LANJUT[jenis] || jenis === "administrasi" ? (
          <div className="self-end pb-2 text-xs text-slate-500">
            Tahap: {TAHAP_LABEL[JENIS_LANJUT[jenis]?.dari ?? "administrasi"]}
            {jenis === "administrasi" || jenis === "lolos_administrasi" ? " (belum diputuskan)" : ""}
          </div>
        ) : (
          <div>
            <label htmlFor="tahap" className="mb-1 block text-xs font-medium text-slate-600">
              Tahap saat ini
            </label>
            <select id="tahap" name="tahap" defaultValue={tahapDipilih} className={inputCls}>
              {TAHAP.filter((t) => t !== "pengumuman").map((t) => (
                <option key={t} value={t}>
                  {TAHAP_LABEL[t]}
                </option>
              ))}
              <option value="semua">Semua tahap</option>
            </select>
          </div>
        )}
        <div>
          <label htmlFor="tahun" className="mb-1 block text-xs font-medium text-slate-600">
            Tahun daftar
          </label>
          <select id="tahun" name="tahun" defaultValue={tahunDipilih} className={inputCls}>
            <option value={SEMUA_TAHUN}>Semua tahun</option>
            {pilihanTahun.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Terapkan</button>
          <Link href={`/admin/pengumuman?jenis=${jenis}`} className="rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100">
            Reset
          </Link>
        </div>
      </form>
      {parseTahun(sp.tahun) === undefined && sp.tahun !== SEMUA_TAHUN && (
        <p className="-mt-2 text-xs text-slate-500">Menampilkan tahun berjalan ({tahunBerjalan()}); berpindah otomatis setiap 1 Januari.</p>
      )}

      {terpotong && (
        <Alert tone="warning" title={`Hanya ${BATAS_KANDIDAT} nama pertama yang ditampilkan`}>
          Persempit dengan pencarian atau filter tahap/tahun agar daftar lengkap. Umumkan yang tampil lebih dulu, sisanya akan muncul setelah daftar dimuat ulang.
        </Alert>
      )}

      {/* key: daftar baru (mis. setelah ganti mode/filter) mengosongkan pilihan lama */}
      <FormPengumuman
        key={`${jenis}-${sp.tahap}-${sp.tahun}-${sp.q}`}
        jenis={jenis}
        rows={rows.map((r) => ({
          id: r.id,
          nama: r.nama,
          nomorKip: r.nomorKip,
          nisn: r.nisn,
          sekolah: r.sekolah,
          tahapLabel: TAHAP_LABEL[r.tahap ?? "administrasi"],
          jurusan1Id: r.jurusan1Id,
          jurusan1: r.jurusan1,
          jurusan2Id: r.jurusan2Id,
          jurusan2: r.jurusan2,
        }))}
        opsiAlasan={jenis === "administrasi" ? [...ALASAN_TIDAK_LOLOS_ADMINISTRASI] : jenis === "ditolak" ? [...ALASAN_TIDAK_DITERIMA] : []}
        beasiswa={beasiswa}
        action={umumkanMassal.bind(null, jenis)}
      />
    </div>
  );
}

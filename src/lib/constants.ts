import type { JenisBerkas, Status, Tahap } from "@/db/schema";

/** Tahun lulus yang boleh mendaftar: tahun berjalan (WIB) dan dua tahun sebelumnya, berganti otomatis tiap 1 Januari. Terurut naik. */
export function tahunLulusBoleh(): number[] {
  const sekarang = new Date(Date.now() + 7 * 3600e3).getUTCFullYear();
  return [sekarang - 2, sekarang - 1, sekarang];
}
export const MAX_UMUR = 21;
export const MAX_FILE_MB = 2;
export const MIME_DIIZINKAN = ["application/pdf", "image/jpeg", "image/png"];
export const LINK_FORMAT_SURAT = "https://s.id/permohonandirektur-kiptedc";

export const STATUS_LABEL: Record<Status, string> = {
  draft: "Belum dikirim",
  terkirim: "Seleksi Administrasi",
  diperiksa: "Dalam proses seleksi",
  perbaikan: "Perlu perbaikan",
  diterima: "Diterima",
  ditolak: "Tidak diterima",
};

/** Warna lencana status: selalu disertai teks label, jadi tidak bergantung pada warna saja. */
export const STATUS_TONE: Record<Status, string> = {
  draft: "bg-slate-100 text-slate-700 ring-slate-300",
  terkirim: "bg-sky-50 text-sky-800 ring-sky-300",
  diperiksa: "bg-sky-50 text-sky-800 ring-sky-300",
  perbaikan: "bg-amber-50 text-amber-900 ring-amber-300",
  diterima: "bg-emerald-50 text-emerald-800 ring-emerald-300",
  ditolak: "bg-rose-50 text-rose-800 ring-rose-300",
};

export const TAHAP_LABEL: Record<Tahap, string> = {
  administrasi: "Seleksi Administrasi",
  ujian: "Seleksi Ujian",
  wawancara: "Seleksi Wawancara",
  pengusulan: "Pengusulan",
  pengumuman: "Pengumuman",
};

export const TAHAP_DESKRIPSI: Record<Tahap, string> = {
  administrasi: "Admin memeriksa kelengkapan dan kebenaran data serta berkas Anda.",
  ujian: "Ujian seleksi calon penerima KIP Kuliah. Ikuti jadwal dan petunjuk pada catatan admin.",
  wawancara: "Wawancara dan verifikasi kondisi ekonomi keluarga.",
  pengusulan: "Anda diminta menjawab apakah bersedia diusulkan sebagai calon penerima KIP Kuliah. Setelah bersedia, status menjadi Diusulkan dan tinggal menunggu pengumuman.",
  pengumuman: "Hasil akhir seleksi diumumkan.",
};

/** Pilihan alasan bila pendaftar dinyatakan tidak lolos Seleksi Administrasi. Tambahkan alasan lain di sini. */
export const ALASAN_TIDAK_LOLOS_ADMINISTRASI = ["Administrasi Tidak Lolos"] as const;
/** Desil yang tidak memenuhi ketentuan bila pendaftar bukan penerima PIP: otomatis tidak lolos Seleksi Administrasi saat formulir dikirim. */
export const DESIL_TIDAK_SESUAI: readonly string[] = ["5", "6-10"];
export const ALASAN_DESIL = "Desil Tidak Sesuai Ketentuan";
export const PESAN_DESIL =
  "Mohon Maaf Desil Tidak Sesuai Dengan Ketentuan Kemendikristek, Silahkan Melakukan Penurunan Desil Terlebih Dahulu dan jika sudah turun bisa hubungi admin";
/** Alasan baku bila pendaftar menjawab tidak bersedia diusulkan; alasan lengkap ditulis pendaftar sendiri. */
export const ALASAN_TIDAK_BERSEDIA = "Tidak Bersedia Diusulkan";
/** Pilihan alasan bila hasil Pengumuman adalah tidak diterima. */
export const ALASAN_TIDAK_DITERIMA = ["Ditetapkan PTS Lain", "Gagal Pengusulan", "Dicalonkan PTS Lain", "Mengundurkan Diri"] as const;

/** Label proses yang dilihat pendaftar & admin: tahap seleksi bila sedang berjalan, hasil bila sudah diputuskan. */
export function labelProses(status: Status, tahap: Tahap | null | undefined, usulan?: string | null) {
  if (tahap === "pengusulan") {
    if (status === "ditolak" && usulan === "tidak") return "Tidak bersedia diusulkan";
    if ((status === "terkirim" || status === "diperiksa") && usulan === "menunggu") return "Pengusulan (menunggu jawaban)";
    if ((status === "terkirim" || status === "diperiksa") && usulan === "bersedia") return "Diusulkan";
  }
  if ((status === "terkirim" || status === "diperiksa") && tahap) return TAHAP_LABEL[tahap];
  // Gugur sebelum Pengumuman, mis. tidak lolos Seleksi Administrasi.
  if (status === "ditolak" && tahap && tahap !== "pengumuman") return `Tidak lolos ${TAHAP_LABEL[tahap]}`;
  return STATUS_LABEL[status];
}

/** Label baris riwayat: status lama, tahap seleksi, hasil tahap ("lolos:<tahap>"/"tidak_lolos:<tahap>"), atau hasil pengumuman. */
export function labelRiwayat(s: string) {
  const khusus: Record<string, string> = { wawancara_selesai: "Selesai Seleksi Wawancara", diusulkan: "Bersedia diusulkan", tidak_diusulkan: "Tidak bersedia diusulkan", terkirim: "Pendaftaran dikirim", diterima: "Pengumuman: Diterima", ditolak: "Pengumuman: Tidak diterima" };
  const [jenis, t] = s.split(":");
  if (t && t in TAHAP_LABEL) return `${jenis === "lolos" ? "Lolos" : "Tidak lolos"} ${TAHAP_LABEL[t as Tahap]}`;
  return khusus[s] ?? (TAHAP_LABEL as Record<string, string>)[s] ?? (STATUS_LABEL as Record<string, string>)[s] ?? s;
}

export const BERKAS_INFO: Record<JenisBerkas, { label: string; tips: string; wajib: boolean }> = {
  ijazah: {
    label: "Ijazah SMA/SMK/MA atau sederajat",
    tips: "Pindai/foto halaman depan ijazah. Bila ijazah belum terbit, unggah Surat Keterangan Lulus (SKL) dari sekolah.",
    wajib: true,
  },
  akta_kelahiran: { label: "Akta Kelahiran", tips: "Pastikan nama dan tanggal lahir terbaca jelas — dipakai untuk memeriksa umur.", wajib: true },
  kk: { label: "Kartu Keluarga (KK)", tips: "Gunakan KK terbaru. Nama ayah, ibu, dan anggota keluarga harus terlihat.", wajib: true },
  ktp: { label: "Kartu Tanda Penduduk (KTP)", tips: "Foto KTP tanpa terpotong dan tidak silau. NIK harus sama dengan isian Data Diri.", wajib: true },
  surat_permohonan_direktur: {
    label: "Surat Permohonan kepada Direktur",
    tips: "Gunakan format resmi di s.id/permohonandirektur-kiptedc, isi, tanda tangani, lalu pindai.",
    wajib: true,
  },
  surat_ekonomi: {
    label: "Surat Keterangan Kebutuhan Ekonomi",
    tips: "Mis. SKTM dari desa/kelurahan. Opsional, namun membantu penilaian ekonomi.",
    wajib: false,
  },
};

export const BERKAS_UTAMA: JenisBerkas[] = ["ijazah", "akta_kelahiran", "kk", "ktp", "surat_permohonan_direktur"];
export const JENIS_URUT: JenisBerkas[] = [...BERKAS_UTAMA, "surat_ekonomi"];

export const LANGKAH = [
  { slug: "data-diri", label: "Data Diri" },
  { slug: "keluarga", label: "Data Keluarga" },
  { slug: "ekonomi", label: "Ekonomi Orang Tua" },
  { slug: "sekolah", label: "Sekolah & Jurusan" },
  { slug: "rekomendasi", label: "Rekomendasi" },
  { slug: "berkas", label: "Unggah Berkas" },
  { slug: "ringkasan", label: "Ringkasan & Kirim" },
] as const;

export const DESIL_LABEL: Record<string, string> = {
  "1": "Desil 1",
  "2": "Desil 2",
  "3": "Desil 3",
  "4": "Desil 4",
  "5": "Desil 5",
  "6-10": "Desil 6–10",
};
export const STATUS_NIKAH_LABEL: Record<string, string> = { belum_menikah: "Belum menikah", menikah: "Menikah" };
export const yaTidak = (v: boolean | null | undefined) => (v == null ? "-" : v ? "Ya" : "Tidak");

/** Normalkan nomor HP Indonesia ke awalan 08; null bila tidak valid. */
export function normalHp(raw: string | undefined) {
  let s = (raw ?? "").replace(/[\s\-().]/g, "");
  if (s.startsWith("+62")) s = "0" + s.slice(3);
  else if (s.startsWith("62")) s = "0" + s.slice(2);
  return /^08\d{8,12}$/.test(s) ? s : null;
}
export type SlugLangkah = (typeof LANGKAH)[number]["slug"];

/** Umur dalam tahun penuh pada tanggal acuan. */
export function hitungUmur(tanggalLahir: string, acuan = new Date()) {
  const [y, m, d] = tanggalLahir.split("-").map(Number);
  let umur = acuan.getFullYear() - y;
  const belumUlangTahun = acuan.getMonth() + 1 < m || (acuan.getMonth() + 1 === m && acuan.getDate() < d);
  if (belumUlangTahun) umur--;
  return umur;
}

export const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export const tanggal = (d: Date | null | undefined, withTime = true) =>
  d
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        ...(withTime ? { timeStyle: "short" } : {}),
        timeZone: "Asia/Jakarta",
      }).format(d)
    : "-";

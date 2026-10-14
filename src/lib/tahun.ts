/** Filter tahun panel admin: berdasarkan waktu pendaftar membuat akun (mendaftar), dalam zona WIB. */
export const TAHUN_MULAI = 2026;

const WIB_MS = 7 * 3600e3;

/** Tahun kalender saat ini menurut WIB. */
export const tahunSekarang = () => new Date(Date.now() + WIB_MS).getUTCFullYear();

/** Tahun dari teks (mis. query string); undefined bila kosong/"semua"/tidak valid (< 2026). */
export function parseTahun(s?: string | null): number | undefined {
  const n = Number(s);
  return Number.isInteger(n) && n >= TAHUN_MULAI && n <= 2100 ? n : undefined;
}

/** Batas waktu [dari, sampai) untuk satu tahun, mengikuti WIB (1 Januari 00.00 WIB). */
export function rentangTahun(tahun: number) {
  return { dari: new Date(`${tahun}-01-01T00:00:00+07:00`), sampai: new Date(`${tahun + 1}-01-01T00:00:00+07:00`) };
}

/** Daftar pilihan tahun: dari 2026 sampai tahun terbaru (tahun berjalan atau tahun data terakhir bila lebih besar). */
export function daftarPilihanTahun(tahunDataTerakhir?: number | null) {
  const akhir = Math.max(TAHUN_MULAI, tahunSekarang(), tahunDataTerakhir ?? 0);
  return Array.from({ length: akhir - TAHUN_MULAI + 1 }, (_, i) => TAHUN_MULAI + i);
}

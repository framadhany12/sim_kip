/** Filter tahun panel admin: berdasarkan waktu pendaftar membuat akun (mendaftar), dalam zona WIB. */
export const TAHUN_MULAI = 2026;

const WIB_MS = 7 * 3600e3;

/** Tahun kalender saat ini menurut WIB. */
export const tahunSekarang = () => new Date(Date.now() + WIB_MS).getUTCFullYear();

/**
 * Tahun yang ditampilkan secara bawaan di panel admin: tahun berjalan menurut jam server (WIB), minimal 2026.
 * Dihitung setiap permintaan, jadi pada 1 Januari 00.00 WIB tampilan awal otomatis berpindah ke tahun baru.
 */
export const tahunBerjalan = () => Math.max(TAHUN_MULAI, tahunSekarang());

/** Nilai filter untuk menampilkan semua tahun. */
export const SEMUA_TAHUN = "semua";

/** Rentang tahun ajaran yang boleh ditambahkan admin. */
export const TAHUN_MIN = 2020;
export const TAHUN_MAX = 2100;

/** Tahun dari teks (mis. query string); undefined bila kosong/"semua"/tidak valid. */
export function parseTahun(s?: string | null): number | undefined {
  const n = Number(s);
  return Number.isInteger(n) && n >= TAHUN_MIN && n <= TAHUN_MAX ? n : undefined;
}

/** Batas waktu [dari, sampai) untuk satu tahun, mengikuti WIB (1 Januari 00.00 WIB). */
export function rentangTahun(tahun: number) {
  return { dari: new Date(`${tahun}-01-01T00:00:00+07:00`), sampai: new Date(`${tahun + 1}-01-01T00:00:00+07:00`) };
}


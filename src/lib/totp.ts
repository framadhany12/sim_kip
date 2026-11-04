import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** TOTP RFC 6238 (SHA-1, 6 digit, 30 detik), kompatibel dengan Google/Microsoft Authenticator, Authy, dll. */
const ABJAD = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const LANGKAH_DETIK = 30;

/** Kunci 32 byte dari MFA_KEY. Di produksi wajib diisi; saat pengembangan memakai kunci tetap. */
export function kunciMfa() {
  const k = process.env.MFA_KEY;
  if (!k && process.env.NODE_ENV === "production") throw new Error("MFA_KEY belum diisi di environment server.");
  return createHash("sha256").update(k || "kip-kuliah-kunci-pengembangan").digest();
}

const base32 = (b: Buffer) => {
  let bits = 0, nilai = 0, out = "";
  for (const x of b) {
    nilai = (nilai << 8) | x;
    bits += 8;
    while (bits >= 5) {
      out += ABJAD[(nilai >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  return bits ? out + ABJAD[(nilai << (5 - bits)) & 31] : out;
};

const dariBase32 = (s: string) => {
  let bits = 0, nilai = 0;
  const out: number[] = [];
  for (const c of s.replace(/=+$/, "").toUpperCase()) {
    const i = ABJAD.indexOf(c);
    if (i < 0) continue;
    nilai = (nilai << 5) | i;
    bits += 5;
    if (bits >= 8) {
      out.push((nilai >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
};

export const buatRahasiaTotp = () => base32(randomBytes(20));

function hotp(rahasia: Buffer, langkah: number) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(langkah));
  const h = createHmac("sha1", rahasia).update(msg).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, "0");
}

/**
 * Memeriksa kode 6 digit (toleransi ±1 langkah untuk selisih jam).
 * Mengembalikan langkah waktu yang cocok, atau null. Langkah ≤ `langkahTerakhir` ditolak agar kode tidak bisa dipakai ulang.
 */
export function periksaKodeTotp(rahasiaBase32: string, kode: string, langkahTerakhir: number | null): number | null {
  if (!/^\d{6}$/.test(kode)) return null;
  const rahasia = dariBase32(rahasiaBase32);
  const sekarang = Math.floor(Date.now() / 1000 / LANGKAH_DETIK);
  const target = Buffer.from(kode);
  for (const d of [-1, 0, 1]) {
    const langkah = sekarang + d;
    if (langkahTerakhir != null && langkah <= langkahTerakhir) continue;
    if (timingSafeEqual(Buffer.from(hotp(rahasia, langkah)), target)) return langkah;
  }
  return null;
}

export function urlOtpauth(email: string, rahasia: string) {
  const isu = "SIM KIP";
  return `otpauth://totp/${encodeURIComponent(`${isu}:${email}`)}?secret=${rahasia}&issuer=${encodeURIComponent(isu)}&algorithm=SHA1&digits=6&period=${LANGKAH_DETIK}`;
}

/** Rahasia TOTP disimpan terenkripsi (AES-256-GCM): iv(12) + tag(16) + data, base64. */
export function enkripsiRahasia(teks: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", kunciMfa(), iv);
  const data = Buffer.concat([c.update(teks, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), data]).toString("base64");
}

export function dekripsiRahasia(simpanan: string) {
  const b = Buffer.from(simpanan, "base64");
  const d = createDecipheriv("aes-256-gcm", kunciMfa(), b.subarray(0, 12));
  d.setAuthTag(b.subarray(12, 28));
  return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
}

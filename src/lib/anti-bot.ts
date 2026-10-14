import "server-only";
import { resolveMx } from "node:dns/promises";
import { headers } from "next/headers";

export const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

// Layanan email sekali pakai yang umum dipakai bot. Tambahkan bila perlu.
const DOMAIN_SEKALI_PAKAI = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.info", "sharklasers.com", "10minutemail.com", "temp-mail.org",
  "tempmail.com", "tempmailo.com", "yopmail.com", "trashmail.com", "getnada.com", "dispostable.com", "maildrop.cc",
  "throwawaymail.com", "fakeinbox.com", "mohmal.com", "emailondeck.com", "mintemail.com", "tempr.email", "discard.email",
]);

/** Domain yang pasti tidak punya kotak masuk (RFC 2606/6761) — ditolak tanpa cek DNS. */
const DOMAIN_CONTOH = /(^|\.)(example\.(com|net|org)|example|test|invalid|localhost)$/i;

const cacheMx = new Map<string, { ok: boolean; exp: number }>();

/**
 * Memastikan email masuk akal untuk dipakai mendaftar: format benar, bukan email sekali pakai,
 * dan domainnya memiliki server email (MX record). Mengembalikan pesan galat atau null.
 */
export async function cekEmailAktif(email: string): Promise<string | null> {
  if (!EMAIL_RE.test(email)) return "Masukkan alamat email yang valid, contoh: nama@gmail.com.";
  const domain = email.split("@")[1].toLowerCase();
  if (DOMAIN_SEKALI_PAKAI.has(domain)) return "Email sekali pakai tidak dapat digunakan. Gunakan email pribadi yang aktif.";
  if (DOMAIN_CONTOH.test(domain)) return `Domain "${domain}" tidak dapat menerima email. Periksa kembali alamat email Anda.`;
  if (process.env.SKIP_MX_CHECK === "true") return null;

  const c = cacheMx.get(domain);
  let ok: boolean;
  if (c && c.exp > Date.now()) ok = c.ok;
  else {
    try {
      const mx = await Promise.race([resolveMx(domain), new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000))]);
      ok = mx.some((r) => r.exchange && r.exchange !== ".");
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "ENOTFOUND" || code === "ENODATA") ok = false; // domain tidak ada / tanpa server email
      else return null; // gangguan DNS sementara: jangan blokir pendaftar, dan jangan disimpan di cache
    }
    cacheMx.set(domain, { ok, exp: Date.now() + 6 * 3600e3 });
  }
  return ok ? null : `Domain "${domain}" tidak dapat menerima email. Periksa ejaan alamat email Anda (mis. gmail.com, bukan gmial.com).`;
}

// ---------- Pembatas percobaan sederhana (per proses server) ----------

const ember = new Map<string, number[]>();

/** True bila `kunci` masih di bawah `maks` percobaan dalam `jendelaMs` terakhir; sekaligus mencatat percobaan ini. */
export function bolehCoba(kunci: string, maks: number, jendelaMs: number) {
  const now = Date.now();
  const list = (ember.get(kunci) ?? []).filter((t) => now - t < jendelaMs);
  if (list.length >= maks) {
    ember.set(kunci, list);
    return false;
  }
  list.push(now);
  ember.set(kunci, list);
  if (ember.size > 10_000) for (const [k, v] of ember) if (!v.some((t) => now - t < jendelaMs)) ember.delete(k);
  return true;
}

export async function ipKlien() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "lokal";
}

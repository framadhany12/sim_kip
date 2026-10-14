import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { headers } from "next/headers";
import { KAMPUS } from "./profil";

/**
 * Pengiriman email lewat SMTP (atur SMTP_* di .env.local).
 * Bila SMTP belum diatur, isi email dicetak ke log server — hanya cocok untuk pengembangan.
 */
export const smtpAktif = () => Boolean(process.env.SMTP_HOST);

let transporter: Transporter | undefined;
function transport() {
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

/** URL dasar aplikasi untuk tautan di email: APP_URL bila diatur, selain itu dari header request. */
export async function urlAplikasi() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function templat({ judul, sapaan, isi, tombol, url, catatan }: { judul: string; sapaan: string; isi: string; tombol: string; url: string; catatan: string }) {
  const html = `<!doctype html><html lang="id"><body style="margin:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #dde3ee;border-radius:12px">
<tr><td style="background:#0d2a63;color:#ffffff;padding:18px 24px;border-radius:12px 12px 0 0;font-size:15px;font-weight:bold">KIP Kuliah · ${esc(KAMPUS.nama)}</td></tr>
<tr><td style="padding:24px">
<h1 style="font-size:20px;margin:0 0 12px">${esc(judul)}</h1>
<p style="margin:0 0 12px;line-height:1.6">${esc(sapaan)}</p>
<p style="margin:0 0 20px;line-height:1.6">${esc(isi)}</p>
<p style="margin:0 0 20px"><a href="${esc(url)}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px">${esc(tombol)}</a></p>
<p style="margin:0 0 8px;font-size:13px;color:#55627a;line-height:1.5">Bila tombol tidak berfungsi, salin tautan ini ke browser:<br><a href="${esc(url)}" style="color:#1d4ed8;word-break:break-all">${esc(url)}</a></p>
<p style="margin:16px 0 0;font-size:13px;color:#55627a;line-height:1.5">${esc(catatan)}</p>
</td></tr></table>
<p style="font-size:12px;color:#55627a;margin:16px 0 0">${esc(KAMPUS.alamat)}</p>
</td></tr></table></body></html>`;
  const text = `${judul}\n\n${sapaan}\n${isi}\n\n${tombol}: ${url}\n\n${catatan}\n\n— KIP Kuliah ${KAMPUS.nama}`;
  return { html, text };
}

async function kirim(to: string, subject: string, isi: { html: string; text: string }, url: string) {
  if (!smtpAktif()) {
    console.info(`[email] (SMTP belum diatur) Kepada: ${to} | ${subject} | ${url}`);
    return;
  }
  await transport().sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject,
    ...isi,
  });
}

export async function kirimEmailVerifikasi(to: string, nama: string, url: string) {
  await kirim(
    to,
    "Verifikasi email pendaftaran KIP Kuliah",
    templat({
      judul: "Verifikasi email Anda",
      sapaan: `Halo ${nama},`,
      isi: "Terima kasih telah membuat akun pendaftaran KIP Kuliah. Tekan tombol di bawah untuk memastikan email ini milik Anda dan mengaktifkan akun. Tautan berlaku 24 jam.",
      tombol: "Verifikasi Email",
      url,
      catatan: "Bila Anda tidak merasa mendaftar, abaikan email ini. Akun tidak akan aktif tanpa verifikasi.",
    }),
    url,
  );
}

export async function kirimEmailResetSandi(to: string, nama: string, url: string) {
  await kirim(
    to,
    "Atur ulang kata sandi KIP Kuliah",
    templat({
      judul: "Atur ulang kata sandi",
      sapaan: `Halo ${nama},`,
      isi: "Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda. Tekan tombol di bawah untuk membuat kata sandi baru. Tautan berlaku 1 jam.",
      tombol: "Buat Kata Sandi Baru",
      url,
      catatan: "Bila Anda tidak meminta ini, abaikan email ini. Kata sandi Anda tidak berubah.",
    }),
    url,
  );
}

/** Pemberitahuan keamanan setelah kata sandi diganti lewat tautan lupa kata sandi. */
export async function kirimEmailSandiDiubah(to: string, nama: string, urlLupa: string, olehAdmin = false) {
  const waktu = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date());
  await kirim(
    to,
    "Kata sandi akun KIP Kuliah Anda telah diubah",
    templat({
      judul: "Kata sandi berhasil diubah",
      sapaan: `Halo ${nama},`,
      isi: olehAdmin
        ? `Kata sandi akun pendaftaran KIP Kuliah Anda diatur ulang oleh admin pada ${waktu} WIB. Admin akan menyampaikan kata sandi baru kepada Anda. Semua perangkat yang sebelumnya masuk telah dikeluarkan. Setelah masuk, sebaiknya ganti kata sandi di menu Akun Saya.`
        : `Kata sandi akun pendaftaran KIP Kuliah Anda telah diubah pada ${waktu} WIB. Semua perangkat yang sebelumnya masuk telah dikeluarkan.`,
      tombol: "Bukan Saya — Atur Ulang Lagi",
      url: urlLupa,
      catatan: "Bila Anda yang mengubahnya, abaikan email ini. Bila bukan, segera atur ulang kata sandi dan hubungi admin.",
    }),
    urlLupa,
  );
}

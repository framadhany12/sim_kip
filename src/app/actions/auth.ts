"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, gt, isNull, lt, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { dataDiri, emailVerifications, passwordResets, pendaftaran, sessions, users } from "@/db/schema";
import { createSession, destroySession, getCurrentUser, newToken, requireUser, sha256 } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { STATUS_MAHASISWA_LABEL, tanggalPanjang } from "@/lib/constants";
import { isDuplikat } from "@/lib/pendaftaran";
import { bolehCoba, cekEmailAktif, EMAIL_RE, ipKlien } from "@/lib/anti-bot";
import { kirimEmailResetSandi, kirimEmailSandiDiubah, kirimEmailVerifikasi, smtpAktif, urlAplikasi } from "@/lib/mail";

/** Cookie berisi email yang sedang menunggu verifikasi, dipakai halaman "Cek email Anda" & tombol kirim ulang. */
const COOKIE_VERIF = "kip_verif_email";
/** Hanya di mode pengembangan tanpa SMTP: tautan verifikasi ditampilkan di layar agar bisa diuji. */
const COOKIE_DEV_LINK = "kip_dev_link";
const VERIF_JAM = 24;

const NIK_TERDAFTAR = "NIK ini sudah terdaftar. Satu NIK hanya dapat mendaftar satu kali; silakan masuk atau hubungi admin bila Anda belum pernah mendaftar.";
const normalNik = (raw: string | undefined) => (raw ?? "").replace(/\D/g, "");
const galatNik = (e: unknown) => /nik/i.test(String((e as { cause?: { message?: string }; message?: string })?.cause?.message ?? (e as Error)?.message ?? ""));

const normalEmail = (raw: string | undefined) => (raw ?? "").trim().toLowerCase();

function cekSandi(pw: string) {
  if (pw.length < 8) return "Kata sandi minimal 8 karakter.";
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return "Kata sandi harus memuat huruf dan angka.";
  return null;
}

/** Buat token verifikasi baru (token lama dibatalkan) lalu kirim email. */
async function kirimTautanVerifikasi(user: { id: string; nama: string; email: string }) {
  const db = await getDb();
  const token = newToken();
  await db.delete(emailVerifications).where(eq(emailVerifications.userId, user.id));
  await db.insert(emailVerifications).values({ id: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + VERIF_JAM * 3600e3) });
  const url = `${await urlAplikasi()}/verifikasi/${token}`;
  await kirimEmailVerifikasi(user.email, user.nama, url);
  const jar = await cookies();
  jar.set(COOKIE_VERIF, user.email, { httpOnly: true, sameSite: "lax", path: "/", maxAge: VERIF_JAM * 3600 });
  if (!smtpAktif() && process.env.NODE_ENV !== "production") jar.set(COOKIE_DEV_LINK, url, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 3600 });
}

export async function daftar(_: FormState, fd: FormData): Promise<FormState> {
  const v = nilaiForm(fd);
  delete v.password;
  delete v.password2;

  // Jebakan bot: kolom tersembunyi yang tidak terlihat manusia, dan formulir yang dikirim terlalu cepat.
  if (v.website) redirect("/verifikasi-email"); // pura-pura berhasil agar bot tidak belajar
  if (Date.now() - Number(v.t || 0) < 2500) return { message: "Mohon periksa kembali isian Anda, lalu tekan Buat Akun sekali lagi.", values: v };
  if (!bolehCoba(`daftar:${await ipKlien()}`, 8, 3600e3))
    return { message: "Terlalu banyak percobaan pendaftaran dari jaringan ini. Coba lagi dalam 1 jam.", values: v };

  const errors: Record<string, string> = {};
  if (v.nama.length < 3) errors.nama = "Isi nama lengkap sesuai KTP/Akta.";
  const nik = normalNik(v.nik);
  if (nik.length !== 16) errors.nik = "NIK harus 16 digit angka (lihat KTP atau Kartu Keluarga).";
  const email = normalEmail(v.email);
  const emailErr = await cekEmailAktif(email);
  if (emailErr) errors.email = emailErr;
  const pw = String(fd.get("password") ?? "");
  const pwErr = cekSandi(pw);
  if (pwErr) errors.password = pwErr;
  if (pw !== fd.get("password2")) errors.password2 = "Konfirmasi kata sandi tidak sama.";
  if (Object.keys(errors).length) return { errors, values: v };

  const db = await getDb();
  // Satu NIK = satu akun. Akun yang belum terverifikasi lebih dari batas waktu verifikasi dianggap kedaluwarsa dan melepas NIK-nya.
  await db.delete(users).where(and(eq(users.nik, nik), eq(users.role, "pendaftar"), isNull(users.emailVerifiedAt), lt(users.createdAt, new Date(Date.now() - VERIF_JAM * 3600e3))));
  const [ada] = await db.select().from(users).where(eq(users.email, email));
  const [pemilikNik] = await db.select({ id: users.id }).from(users).where(eq(users.nik, nik));
  if (pemilikNik && pemilikNik.id !== ada?.id) return { errors: { nik: NIK_TERDAFTAR }, values: v };
  const [dataNik] = await db
    .select({ id: dataDiri.id })
    .from(dataDiri)
    .innerJoin(pendaftaran, eq(pendaftaran.id, dataDiri.pendaftaranId))
    .where(and(eq(dataDiri.nik, nik), ada ? ne(pendaftaran.userId, ada.id) : undefined))
    .limit(1);
  if (dataNik) return { errors: { nik: NIK_TERDAFTAR }, values: v };
  if (ada?.emailVerifiedAt || ada?.role === "admin") return { errors: { email: "Email ini sudah terdaftar. Silakan masuk." }, values: v };

  const passwordHash = await hashPassword(pw);
  let user: { id: string; nama: string; email: string };
  if (ada) {
    // Akun belum terverifikasi: perbarui datanya dan kirim tautan baru. Hanya pemilik kotak masuk yang bisa mengaktifkannya.
    await db.update(users).set({ nama: v.nama, passwordHash, nik }).where(eq(users.id, ada.id));
    user = { id: ada.id, nama: v.nama, email };
  } else {
    const id = crypto.randomUUID();
    try {
      await db.insert(users).values({ id, nama: v.nama, email, nik, passwordHash });
    } catch (e) {
      if (isDuplikat(e)) return { errors: galatNik(e) ? { nik: NIK_TERDAFTAR } : { email: "Email ini sudah terdaftar. Silakan masuk." }, values: v };
      throw e;
    }
    user = { id, nama: v.nama, email };
  }
  try {
    await kirimTautanVerifikasi(user);
  } catch (e) {
    console.error("[email] gagal mengirim verifikasi:", e);
    return { message: "Akun dibuat, tetapi email verifikasi gagal dikirim. Coba tekan Buat Akun lagi beberapa saat lagi.", values: v };
  }
  redirect("/verifikasi-email");
}

export async function kirimUlangVerifikasi(_: FormState, fd: FormData): Promise<FormState> {
  const jar = await cookies();
  const email = normalEmail(String(fd.get("email") ?? "") || jar.get(COOKIE_VERIF)?.value);
  const pesan: FormState = { ok: true, message: "Jika email tersebut terdaftar dan belum diverifikasi, tautan baru sudah dikirim. Periksa juga folder Spam." };
  if (!EMAIL_RE.test(email)) return { errors: { email: "Masukkan email yang Anda pakai saat mendaftar." } };
  if (!bolehCoba(`ulang:${email}`, 1, 60e3)) return { message: "Tunggu 1 menit sebelum meminta tautan baru." };
  if (!bolehCoba(`ulang-jam:${email}`, 5, 3600e3) || !bolehCoba(`ulang-ip:${await ipKlien()}`, 15, 3600e3))
    return { message: "Terlalu banyak permintaan. Coba lagi dalam 1 jam." };
  const db = await getDb();
  const [u] = await db.select().from(users).where(eq(users.email, email));
  if (u && !u.emailVerifiedAt) {
    try {
      await kirimTautanVerifikasi(u);
    } catch (e) {
      console.error("[email] gagal mengirim verifikasi:", e);
      return { message: "Email gagal dikirim. Coba lagi beberapa saat lagi." };
    }
  }
  revalidatePath("/verifikasi-email");
  return pesan;
}

export async function masuk(_: FormState, fd: FormData): Promise<FormState> {
  const v = nilaiForm(fd);
  delete v.password;
  const idn = normalEmail(v.email);
  const lewatNik = /^\d{16}$/.test(idn);
  const email = idn;
  const pw = String(fd.get("password") ?? "");
  const gagal = { message: "Email/NIK atau kata sandi salah.", values: v };
  if (!email || !pw) return gagal;
  if (!bolehCoba(`masuk:${email}`, 10, 15 * 60e3)) return { message: "Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.", values: v };
  const db = await getDb();
  const [u] = await db.select().from(users).where(lewatNik ? eq(users.nik, idn) : eq(users.email, email));
  if (!u || !(await verifyPassword(pw, u.passwordHash))) return gagal;
  if (!u.aktif) {
    const [p] = u.role === "pendaftar" ? await db.select({ s: pendaftaran.statusMahasiswa, tgl: pendaftaran.statusMahasiswaTanggal }).from(pendaftaran).where(eq(pendaftaran.userId, u.id)).limit(1) : [];
    if (p && p.s !== "aktif") {
      const sejak = p.tgl ? ` sejak ${tanggalPanjang(p.tgl)}` : "";
      return { message: `Status mahasiswa Anda: ${STATUS_MAHASISWA_LABEL[p.s]}${sejak}, sehingga akun ini tidak aktif lagi. Hubungi admin KIP Kuliah bila status ini keliru.`, values: v };
    }
    return { message: "Akun Anda dinonaktifkan. Hubungi admin untuk mengaktifkannya kembali.", values: v };
  }
  if (u.role === "pendaftar" && !u.emailVerifiedAt) {
    (await cookies()).set(COOKIE_VERIF, u.email, { httpOnly: true, sameSite: "lax", path: "/", maxAge: VERIF_JAM * 3600 });
    redirect("/verifikasi-email?belum=1");
  }
  await createSession(u.id);
  redirect(u.role === "admin" ? "/admin" : "/dashboard");
}

export async function keluar() {
  await destroySession();
  redirect("/masuk");
}

export async function lupaSandi(_: FormState, fd: FormData): Promise<FormState> {
  const v = nilaiForm(fd);
  const email = normalEmail(v.email);
  if (!EMAIL_RE.test(email)) return { errors: { email: "Masukkan email akun Anda." }, values: v };
  if (!bolehCoba(`lupa:${email}`, 3, 3600e3) || !bolehCoba(`lupa-ip:${await ipKlien()}`, 10, 3600e3))
    return { message: "Terlalu banyak permintaan. Coba lagi dalam 1 jam.", values: v };
  const db = await getDb();
  const [u] = await db.select().from(users).where(eq(users.email, email));
  let devLink = "";
  if (u) {
    const token = newToken();
    await db.delete(passwordResets).where(eq(passwordResets.userId, u.id)); // hanya tautan terbaru yang berlaku
    await db.insert(passwordResets).values({ id: sha256(token), userId: u.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
    const url = `${await urlAplikasi()}/reset-sandi/${token}`;
    try {
      await kirimEmailResetSandi(u.email, u.nama, url);
    } catch (e) {
      console.error("[email] gagal mengirim reset sandi:", e);
      return { message: "Email gagal dikirim. Coba lagi beberapa saat lagi.", values: v };
    }
    if (!smtpAktif() && process.env.NODE_ENV !== "production") devLink = url;
  }
  return {
    ok: true,
    message:
      "Jika email terdaftar, tautan untuk mengatur ulang kata sandi telah dikirim dan berlaku 1 jam. Periksa juga folder Spam." +
      (devLink ? ` [Mode pengembangan, SMTP belum diatur] Tautan: ${devLink}` : ""),
  };
}

export async function resetSandi(token: string, _: FormState, fd: FormData): Promise<FormState> {
  const pw = String(fd.get("password") ?? "");
  const pwErr = cekSandi(pw);
  if (pwErr) return { errors: { password: pwErr } };
  if (pw !== fd.get("password2")) return { errors: { password2: "Konfirmasi kata sandi tidak sama." } };
  const db = await getDb();
  const [r] = await db
    .select()
    .from(passwordResets)
    .where(and(eq(passwordResets.id, sha256(token)), gt(passwordResets.expiresAt, new Date())));
  if (!r) return { message: "Tautan tidak berlaku atau sudah kedaluwarsa. Silakan minta tautan baru." };
  // Membuka tautan dari email juga membuktikan kepemilikan email.
  const [u] = await db.select().from(users).where(eq(users.id, r.userId));
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash: await hashPassword(pw), ...(u.emailVerifiedAt ? {} : { emailVerifiedAt: new Date() }) })
      .where(eq(users.id, r.userId));
    // Token sekali pakai: semua token reset & sesi lama milik akun ini dibatalkan.
    await tx.delete(passwordResets).where(eq(passwordResets.userId, r.userId));
    await tx.delete(sessions).where(eq(sessions.userId, r.userId));
  });
  try {
    await kirimEmailSandiDiubah(u.email, u.nama, `${await urlAplikasi()}/lupa-sandi`);
  } catch (e) {
    console.error("[email] gagal mengirim pemberitahuan sandi diubah:", e);
  }
  redirect("/masuk?reset=1");
}

export async function perbaruiAkun(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  const v = nilaiForm(fd);
  const errors: Record<string, string> = {};
  if (v.nama.length < 3) errors.nama = "Nama minimal 3 huruf.";
  // Email pendaftar sudah diverifikasi dan tidak bisa diganti sendiri; admin boleh mengganti emailnya.
  const email = me.role === "admin" ? normalEmail(v.email) : me.email;
  if (me.role === "admin" && !EMAIL_RE.test(email)) errors.email = "Masukkan email yang valid.";
  if (Object.keys(errors).length) return { errors, values: v };
  const db = await getDb();
  const [bentrok] = await db.select({ id: users.id }).from(users).where(and(eq(users.email, email), ne(users.id, me.id)));
  if (bentrok) return { errors: { email: "Email sudah dipakai akun lain." }, values: v };
  await db.update(users).set({ nama: v.nama, email }).where(eq(users.id, me.id));
  revalidatePath("/", "layout");
  return { ok: true, message: "Data akun berhasil diperbarui." };
}

export async function ubahSandi(_: FormState, fd: FormData): Promise<FormState> {
  const me = await getCurrentUser();
  if (!me) redirect("/masuk");
  const db = await getDb();
  const [u] = await db.select().from(users).where(eq(users.id, me.id));
  if (!(await verifyPassword(String(fd.get("lama") ?? ""), u.passwordHash))) return { errors: { lama: "Kata sandi lama salah." } };
  const pw = String(fd.get("password") ?? "");
  const pwErr = cekSandi(pw);
  if (pwErr) return { errors: { password: pwErr } };
  if (pw !== fd.get("password2")) return { errors: { password2: "Konfirmasi kata sandi tidak sama." } };
  await db.update(users).set({ passwordHash: await hashPassword(pw), wajibGantiSandi: false }).where(eq(users.id, me.id));
  return { ok: true, message: "Kata sandi berhasil diubah." };
}

/** Login pertama akun impor: sandi awal (NIK) wajib diganti. Pengguna baru saja memasukkan sandi awal, jadi sandi lama tidak diminta lagi. */
export async function gantiSandiAwal(_: FormState, fd: FormData): Promise<FormState> {
  const me = await getCurrentUser();
  if (!me) redirect("/masuk");
  if (!me.wajibGantiSandi) redirect("/dashboard");
  const db = await getDb();
  const [u] = await db.select({ nik: users.nik }).from(users).where(eq(users.id, me.id));
  const pw = String(fd.get("password") ?? "");
  const pwErr = cekSandi(pw);
  if (pwErr) return { errors: { password: pwErr } };
  if (u?.nik && pw.includes(u.nik)) return { errors: { password: "Kata sandi baru tidak boleh memuat NIK Anda." } };
  if (pw !== fd.get("password2")) return { errors: { password2: "Konfirmasi kata sandi tidak sama." } };
  await db.update(users).set({ passwordHash: await hashPassword(pw), wajibGantiSandi: false }).where(eq(users.id, me.id));
  revalidatePath("/", "layout");
  redirect(me.mahasiswaLama ? "/lengkapi-data" : "/dashboard");
}

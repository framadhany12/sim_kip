"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { passwordResets, profilAdmin, sessions, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { EMAIL_RE } from "@/lib/anti-bot";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { kirimEmailSandiDiubah, urlAplikasi } from "@/lib/mail";
import { hashPassword } from "@/lib/password";
import { buatSandiAcak } from "@/lib/sandi-acak";

async function ambilAdmin(id: string) {
  const db = await getDb();
  const [u] = await db.select().from(users).where(and(eq(users.id, id), eq(users.role, "admin")));
  return u ?? null;
}

/** Nomor WhatsApp ke format internasional tanpa plus (08123… → 628123…); undefined bila tidak valid. */
function normalisasiWa(s: string): string | undefined {
  let d = s.replace(/[\s().-]/g, "").replace(/^\+/, "");
  if (!/^\d+$/.test(d)) return undefined;
  if (d.startsWith("0")) d = "62" + d.slice(1);
  return /^\d{9,15}$/.test(d) ? d : undefined;
}

/** Menambah akun admin. Kata sandi dikosongkan = dibuatkan acak; sandi ditampilkan sekali di `values.sandi`. */
export async function tambahAdmin(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const v = nilaiForm(fd);
  const email = (v.email ?? "").toLowerCase();
  const e: Record<string, string> = {};
  if ((v.nama ?? "").length < 3) e.nama = "Nama minimal 3 huruf.";
  if (!EMAIL_RE.test(email)) e.email = "Masukkan alamat email yang valid.";
  let sandi = fd.get("password") ? String(fd.get("password")) : "";
  if (sandi) {
    if (sandi.length < 8) e.password = "Kata sandi minimal 8 karakter.";
    else if (!/[a-zA-Z]/.test(sandi) || !/\d/.test(sandi)) e.password = "Kata sandi harus memuat huruf dan angka.";
    else if (sandi.length > 100) e.password = "Kata sandi maksimal 100 karakter.";
  } else sandi = buatSandiAcak();
  const db = await getDb();
  if (!e.email) {
    const [ada] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (ada) e.email = "Email sudah terdaftar sebagai akun lain (admin atau pendaftar).";
  }
  if (Object.keys(e).length) return { errors: e, values: { nama: v.nama ?? "", email: v.email ?? "" } };

  const id = crypto.randomUUID();
  const hash = await hashPassword(sandi);
  await db.transaction(async (tx) => {
    await tx.insert(users).values({ id, nama: v.nama, email, passwordHash: hash, role: "admin", emailVerifiedAt: new Date() });
    await tx.insert(profilAdmin).values({ userId: id });
  });
  revalidatePath("/admin/user");
  return {
    ok: true,
    values: { sandi, email },
    message: `Akun admin ${v.nama} dibuat dan langsung aktif.`,
  };
}

/** Mengatur ulang kata sandi admin lain (sandi sendiri diubah di Akun Saya). Hasilnya ditampilkan sekali. */
export async function aturSandiAdmin(userId: string, _: FormState, fd: FormData): Promise<FormState> {
  const aktor = await requireAdmin();
  if (aktor.id === userId) return { message: "Untuk mengubah kata sandi sendiri, gunakan menu Akun Saya." };
  const u = await ambilAdmin(userId);
  if (!u) return { message: "Akun admin tidak ditemukan." };
  const mode = String(fd.get("mode") ?? "acak");
  let sandi: string;
  if (mode === "manual") {
    sandi = String(fd.get("password") ?? "");
    if (sandi.length < 8) return { errors: { password: "Kata sandi minimal 8 karakter." } };
    if (!/[a-zA-Z]/.test(sandi) || !/\d/.test(sandi)) return { errors: { password: "Kata sandi harus memuat huruf dan angka." } };
    if (sandi.length > 100) return { errors: { password: "Kata sandi maksimal 100 karakter." } };
  } else sandi = buatSandiAcak();

  const db = await getDb();
  const hash = await hashPassword(sandi);
  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash: hash }).where(eq(users.id, userId));
    await tx.delete(sessions).where(eq(sessions.userId, userId));
    await tx.delete(passwordResets).where(eq(passwordResets.userId, userId));
  });
  let emailTerkirim = true;
  try {
    await kirimEmailSandiDiubah(u.email, u.nama, `${await urlAplikasi()}/lupa-sandi`, true);
  } catch (err) {
    emailTerkirim = false;
    console.error("[email] gagal mengirim pemberitahuan reset sandi admin:", err);
  }
  revalidatePath("/admin/user");
  return {
    ok: true,
    values: { sandi },
    message:
      "Kata sandi admin diatur ulang dan admin tersebut dikeluarkan dari semua perangkat." +
      (emailTerkirim ? " Email pemberitahuan sudah dikirim." : " Email pemberitahuan gagal dikirim; sampaikan kata sandi langsung kepada yang bersangkutan."),
  };
}

/** Profil sederhana admin: jabatan, WhatsApp, keterangan, dan apakah ditampilkan di halaman Bantuan. */
export async function simpanProfilAdmin(userId: string, _: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const u = await ambilAdmin(userId);
  if (!u) return { message: "Akun admin tidak ditemukan." };
  const v = nilaiForm(fd);
  const e: Record<string, string> = {};
  const wa = v.whatsapp ? normalisasiWa(v.whatsapp) : undefined;
  if (v.whatsapp && !wa) e.whatsapp = "Nomor WhatsApp tidak valid. Contoh: 081234567890.";
  if ((v.jabatan ?? "").length > 100) e.jabatan = "Jabatan maksimal 100 karakter.";
  if ((v.keterangan ?? "").length > 300) e.keterangan = "Keterangan maksimal 300 karakter.";
  const tampil = fd.get("tampil") === "on";
  if (tampil && !wa) e.whatsapp = "Isi nomor WhatsApp agar profil bisa ditampilkan ke calon mahasiswa.";
  if (tampil && !v.jabatan) e.jabatan = "Isi jabatan/peran agar profil bisa ditampilkan ke calon mahasiswa.";
  if (Object.keys(e).length) return { errors: e, values: v };

  const data = { jabatan: v.jabatan || null, whatsapp: wa ?? null, keterangan: v.keterangan || null, tampil };
  const db = await getDb();
  await db.insert(profilAdmin).values({ userId, ...data }).onDuplicateKeyUpdate({ set: data });
  revalidatePath("/", "layout");
  return { ok: true, message: tampil ? "Profil tersimpan dan tampil di halaman Bantuan." : "Profil tersimpan (tidak ditampilkan di halaman Bantuan)." };
}

/** Mengaktifkan/menonaktifkan akun (admin atau pendaftar). Menonaktifkan mencabut semua sesinya; data tidak dihapus. */
export async function aturAktifAkun(userId: string, _: FormState, fd: FormData): Promise<FormState> {
  const aktor = await requireAdmin();
  const aktif = fd.get("aktif") === "1";
  if (aktor.id === userId) return { message: "Anda tidak bisa menonaktifkan akun Anda sendiri." };
  const db = await getDb();
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u) return { message: "Akun tidak ditemukan." };
  if (!aktif && u.role === "admin") {
    const [lain] = await db.select({ id: users.id }).from(users).where(and(eq(users.role, "admin"), eq(users.aktif, true), ne(users.id, userId))).limit(1);
    if (!lain) return { message: "Tidak bisa menonaktifkan: harus tersisa minimal satu admin aktif." };
  }
  await db.transaction(async (tx) => {
    await tx.update(users).set({ aktif }).where(eq(users.id, userId));
    if (!aktif) await tx.delete(sessions).where(eq(sessions.userId, userId));
  });
  revalidatePath("/admin/user");
  revalidatePath("/admin/mahasiswa");
  revalidatePath("/", "layout");
  return { ok: true, message: aktif ? `Akun ${u.nama} diaktifkan kembali.` : `Akun ${u.nama} dinonaktifkan dan dikeluarkan dari semua perangkat.` };
}

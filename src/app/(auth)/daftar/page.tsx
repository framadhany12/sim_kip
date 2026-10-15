import Link from "next/link";
import { connection } from "next/server";
import { daftar } from "@/app/actions/auth";
import { ActionForm, Field, SubmitButton } from "@/components/form";

export const metadata = { title: "Daftar Akun" };

export default async function DaftarPage() {
  await connection(); // waktu render harus per permintaan (dipakai pemeriksaan anti-bot)
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Langkah 1 dari 7</p>
      <h1 className="mt-1 text-xl font-bold text-slate-900">Buat akun pendaftar</h1>
      <p className="mt-1 text-sm text-slate-600">
        Gunakan <b>email pribadi yang aktif</b>. Kami akan mengirim tautan verifikasi ke email tersebut, dan akun baru bisa dipakai setelah
        diverifikasi.
      </p>
      <div className="mt-6">
        <ActionForm action={daftar}>
          <Field name="nama" label="Nama lengkap" required autoComplete="name" hint="Sesuai KTP/Akta Kelahiran." contoh="Siti Nurhaliza" />
          <Field name="nik" label="NIK" required inputMode="numeric" maxLength={16} autoComplete="off" hint="16 digit, ada di KTP atau Kartu Keluarga. Satu NIK hanya dapat mendaftar satu kali." contoh="3277011201060001" />
          <Field
            name="email"
            type="email"
            inputMode="email"
            label="Email aktif"
            required
            autoComplete="email"
            hint="Pastikan bisa Anda buka sekarang. Email sekali pakai tidak diterima."
            contoh="siti.nurhaliza@gmail.com"
          />
          <Field name="password" type="password" label="Kata sandi" required autoComplete="new-password" hint="Minimal 8 karakter, berisi huruf dan angka." />
          <Field name="password2" type="password" label="Ulangi kata sandi" required autoComplete="new-password" />
          {/* Anti-bot: kolom jebakan yang disembunyikan dari manusia, dan waktu formulir dibuka. */}
          <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="website">Website (jangan diisi)</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>
          <input type="hidden" name="t" value={Date.now()} />
          <SubmitButton className="w-full">Buat Akun</SubmitButton>
        </ActionForm>
      </div>
      <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-semibold text-blue-700 hover:underline">
          Masuk
        </Link>
      </p>
    </>
  );
}

import { requirePendaftar } from "@/lib/auth";
import { arahkanBilaBelumLengkap } from "@/lib/mahasiswa-lama";

/** Mahasiswa lama hasil impor wajib melengkapi data sebelum memakai menu Mahasiswa (lapor IPK, kegiatan). */
export default async function MahasiswaLayout({ children }: { children: React.ReactNode }) {
  await arahkanBilaBelumLengkap(await requirePendaftar());
  return children;
}

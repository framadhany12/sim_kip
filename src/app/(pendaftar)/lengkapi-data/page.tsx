import { redirect } from "next/navigation";
import { requirePendaftar } from "@/lib/auth";
import { cekLengkapMahasiswaLama } from "@/lib/mahasiswa-lama";
import { cariPendaftaranUser, muatLengkap } from "@/lib/pendaftaran";

export default async function LengkapiIndex() {
  const user = await requirePendaftar();
  const p = await cariPendaftaranUser(user.id);
  const d = p && (await muatLengkap(p.id));
  redirect(`/lengkapi-data/${(d && cekLengkapMahasiswaLama(d).berikutnya) ?? "data-diri"}`);
}

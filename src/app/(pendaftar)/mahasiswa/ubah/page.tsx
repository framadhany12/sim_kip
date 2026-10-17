import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { wilayahKabupaten } from "@/db/schema";
import { simpanIdentitasMahasiswa } from "@/app/actions/akun-mahasiswa";
import { ActionForm, SubmitButton } from "@/components/form";
import { FieldsDataDiri } from "@/components/pendaftaran-fields";
import { Card } from "@/components/ui";
import { konteksPendaftar } from "@/lib/konteks";
import { sudahMahasiswa } from "@/lib/pendaftaran";
import Link from "next/link";

export const metadata = { title: "Ubah Identitas & Alamat" };

export default async function UbahIdentitasPage() {
  const { d } = await konteksPendaftar();
  if (!sudahMahasiswa(d)) redirect("/dashboard");
  const db = await getDb();
  const kabupaten = await db.select().from(wilayahKabupaten).orderBy(asc(wilayahKabupaten.nama));
  return (
    <Card title="Ubah Identitas & Alamat">
      <ActionForm action={simpanIdentitasMahasiswa}>
        <FieldsDataDiri x={d.diri} namaBawaan={d.user.nama} nikAkun={d.user.nik} kabupaten={kabupaten} tanpaKip />
        <div className="flex items-center justify-between gap-3 pt-2">
          <Link href="/mahasiswa" className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium text-slate-600 ring-1 ring-slate-300 hover:text-slate-900">
            ← Batal
          </Link>
          <SubmitButton>Simpan</SubmitButton>
        </div>
      </ActionForm>
    </Card>
  );
}

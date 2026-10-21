import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { jurusan, wilayahKabupaten } from "@/db/schema";
import { simpanBagianLengkapi } from "@/app/actions/lengkapi-data";
import { ActionForm, Field } from "@/components/form";
import { FormFooter } from "@/components/form-footer";
import { FieldsDataDiri, FieldsEkonomi, FieldsKeluarga, FieldsSekolah } from "@/components/pendaftaran-fields";
import { Card, Dl } from "@/components/ui";
import { requirePendaftar } from "@/lib/auth";
import { BAGIAN_LENGKAPI, type SlugLengkapi } from "@/lib/mahasiswa-lama";
import { cariPendaftaranUser, muatLengkap } from "@/lib/pendaftaran";

export const metadata = { title: "Lengkapi Data" };

export default async function BagianLengkapi({ params }: { params: Promise<{ bagian: string }> }) {
  const { bagian } = await params;
  const i = BAGIAN_LENGKAPI.findIndex((b) => b.slug === bagian);
  if (i < 0) notFound();
  const slug = bagian as SlugLengkapi;
  const user = await requirePendaftar();
  const p = await cariPendaftaranUser(user.id);
  const d = p && (await muatLengkap(p.id));
  if (!d) redirect("/dashboard");
  const db = await getDb();
  const back = i > 0 ? `/lengkapi-data/${BAGIAN_LENGKAPI[i - 1].slug}` : undefined;
  const judul = `${i + 1}. ${BAGIAN_LENGKAPI[i].label}`;

  if (slug === "akademik" && d.nim && d.kelas)
    return (
      <Card title={judul}>
        <div className="space-y-3">
          <Dl items={[["NIM", d.nim], ["Kelas", d.kelas]]} />
          <p className="text-sm text-slate-600">
            NIM dan kelas sudah tersimpan dan tidak dapat diubah sendiri. Bila ada yang salah, hubungi admin lewat{" "}
            <Link href="/bantuan" className="font-semibold text-blue-700 hover:underline">
              halaman Bantuan
            </Link>
            .
          </p>
        </div>
      </Card>
    );

  let isi: React.ReactNode;
  if (slug === "data-diri") {
    const kabupaten = await db.select().from(wilayahKabupaten).orderBy(asc(wilayahKabupaten.nama));
    isi = <FieldsDataDiri x={d.diri} namaBawaan={d.user.nama} nikAkun={d.user.nik} kabupaten={kabupaten} />;
  } else if (slug === "keluarga") isi = <FieldsKeluarga x={d.keluarga} />;
  else if (slug === "ekonomi") isi = <FieldsEkonomi x={d.ekonomi} />;
  else if (slug === "sekolah") {
    const daftar = await db.select({ value: jurusan.id, label: jurusan.nama }).from(jurusan).where(eq(jurusan.aktif, true)).orderBy(asc(jurusan.nama));
    isi = <FieldsSekolah s={d.sekolah} pilihan={null} jurusan={{ mode: "satu", opsi: daftar, nilai: d.jurusanDiterimaId }} />;
  } else
    isi = (
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="nim" label="NIM" required defaultValue={d.nim} maxLength={30} hint="Sesuai kartu mahasiswa atau KRS." contoh="2024101001" />
        <Field name="kelas" label="Kelas" required defaultValue={d.kelas} maxLength={30} hint="Kelas Anda saat ini." contoh="TI-3A" />
        <p className="text-[13px] text-slate-600 sm:col-span-2">Setelah disimpan, NIM dan kelas hanya bisa diubah oleh admin. Periksa kembali sebelum menyimpan.</p>
      </div>
    );

  return (
    <Card title={judul}>
      <ActionForm action={simpanBagianLengkapi.bind(null, slug)}>
        {isi}
        <FormFooter back={back} sudahDikirim={false} />
      </ActionForm>
    </Card>
  );
}

import Link from "next/link";
import { kirimPendaftaran } from "@/app/actions/formulir";
import { ActionForm, Checkbox, SubmitButton } from "@/components/form";
import { RingkasanData } from "@/components/ringkasan-data";
import { Alert, Card } from "@/components/ui";
import { konteksPendaftar } from "@/lib/konteks";

export const metadata = { title: "Ringkasan & Kirim" };

export default async function RingkasanPage({ searchParams }: { searchParams: Promise<{ diperbarui?: string }> }) {
  const { d, cek, sudahDikirim, terkunci } = await konteksPendaftar();
  const { diperbarui } = await searchParams;
  return (
    <div className="space-y-6">
      {diperbarui && <Alert tone="success">Perubahan tersimpan dan terlihat oleh admin.</Alert>}
      <p className="text-[15px] text-slate-600">Periksa kembali semua isian di bawah.{terkunci ? " Data sudah terkunci dan tidak dapat diubah lagi." : <> Tekan <b>Ubah</b> pada bagian yang ingin diperbaiki.</>}</p>
      <RingkasanData d={d} editLinks={!terkunci} />
      {!sudahDikirim && (
        <Card title="7. Kirim Pendaftaran">
          {cek.siapKirim ? (
            <ActionForm action={kirimPendaftaran}>
              <Alert tone="success">Semua isian dan berkas wajib sudah lengkap. Pendaftaran siap dikirim.</Alert>
              <Checkbox name="setuju">
                Saya menyatakan bahwa data dan berkas yang saya isi adalah <b>benar dan dapat dipertanggungjawabkan</b>. Saya memahami bahwa data
                tidak dapat diubah selama diperiksa admin.
              </Checkbox>
              <div className="flex justify-end">
                <SubmitButton variant="success" className="w-full sm:w-auto">{d.status === "perbaikan" ? "Kirim Ulang Pendaftaran" : "Kirim Pendaftaran"}</SubmitButton>
              </div>
            </ActionForm>
          ) : (
            <Alert tone="warning" title="Belum bisa dikirim">
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {cek.masalah.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </Alert>
          )}
        </Card>
      )}
      {sudahDikirim && (
        <div className="flex justify-end">
          <Link href="/status" className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-gradient-to-b from-[#2563eb] to-[#1646a0] text-white shadow-blue-900/20 hover:brightness-110 px-5 py-2.5 text-[15px] font-semibold shadow-sm sm:w-auto">
            Lihat Status Pendaftaran →
          </Link>
        </div>
      )}
    </div>
  );
}

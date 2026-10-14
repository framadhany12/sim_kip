import Link from "next/link";
import { kirimPendaftaran } from "@/app/actions/formulir";
import { ActionForm, Checkbox, SubmitButton } from "@/components/form";
import { RingkasanData } from "@/components/ringkasan-data";
import { Alert, Card } from "@/components/ui";
import { konteksPendaftar } from "@/lib/konteks";

export const metadata = { title: "Ringkasan & Kirim" };

export default async function RingkasanPage() {
  const { d, cek, editable } = await konteksPendaftar();
  return (
    <div className="space-y-6">
      <p className="text-[15px] text-slate-600">Periksa kembali semua isian di bawah. Tekan <b>Ubah</b> pada bagian yang ingin diperbaiki.</p>
      <RingkasanData d={d} editLinks={editable} />
      {editable && (
        <Card title="7. Kirim Pendaftaran">
          {cek.siapKirim ? (
            <ActionForm action={kirimPendaftaran}>
              <Alert tone="success">Semua isian dan berkas wajib sudah lengkap. Pendaftaran siap dikirim.</Alert>
              <Checkbox name="setuju">
                Saya menyatakan bahwa data dan berkas yang saya isi adalah <b>benar dan dapat dipertanggungjawabkan</b>. Saya memahami bahwa data
                tidak dapat diubah selama diperiksa admin.
              </Checkbox>
              <div className="flex justify-end">
                <SubmitButton variant="success">{d.status === "perbaikan" ? "Kirim Ulang Pendaftaran" : "Kirim Pendaftaran"}</SubmitButton>
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
      {!editable && (
        <div className="flex justify-end">
          <Link href="/status" className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
            Lihat Status Pendaftaran →
          </Link>
        </div>
      )}
    </div>
  );
}

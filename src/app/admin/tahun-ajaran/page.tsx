import { hapusTahunAjaran, tambahTahunAjaran } from "@/app/actions/tahun-ajaran";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { Card, PageHeader } from "@/components/ui";
import { tahunBerjalan } from "@/lib/tahun";
import { daftarPilihanTahun, jumlahPendaftarPerTahun } from "@/lib/tahun-ajaran";

export const metadata = { title: "Tahun Ajaran" };

export default async function TahunAjaranPage() {
  const [daftar, perTahun] = await Promise.all([daftarPilihanTahun(), jumlahPendaftarPerTahun()]);
  const berjalan = tahunBerjalan();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tahun Ajaran"
        desc="Tahun yang tersedia pada filter “Tahun daftar” di Dashboard, Data Pendaftar, Pengumuman, dan Master Calon Mahasiswa. Tahun berjalan selalu tersedia dan dipilih otomatis; tahun yang sudah punya pendaftar tidak dapat dihapus."
      />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Tahun</th>
              <th className="px-4 py-3 font-semibold">Pendaftar</th>
              <th className="px-4 py-3 font-semibold">Keterangan</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[...daftar].reverse().map((t) => {
              const jumlah = perTahun.get(t) ?? 0;
              const bisaHapus = t !== berjalan && jumlah === 0;
              return (
                <tr key={t}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{t}</td>
                  <td className="px-4 py-3">{jumlah}</td>
                  <td className="px-4 py-3 text-slate-500">{t === berjalan ? "Tahun berjalan (bawaan filter)" : ""}</td>
                  <td className="px-4 py-3 text-right">
                    {bisaHapus && (
                      <form action={hapusTahunAjaran}>
                        <input type="hidden" name="tahun" value={t} />
                        <button className="text-xs font-semibold text-rose-700 hover:underline">Hapus</button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Card title="Tambah tahun ajaran">
        <ActionForm action={tambahTahunAjaran} className="flex flex-wrap items-start gap-3" resetOnSuccess>
          <Field name="tahun" label="Tahun" required inputMode="numeric" maxLength={4} contoh="2027" className="w-40" />
          <div className="pt-[1.85rem]">
            <SubmitButton>Tambah Tahun</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}

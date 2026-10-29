import Link from "next/link";
import { redirect } from "next/navigation";
import { BannerPengumuman } from "@/components/pendaftar/banner-pengumuman";
import { FormBukuTabungan } from "@/components/pendaftar/form-buku-tabungan";
import { Alert, Card, Dl } from "@/components/ui";
import { bukuTabunganSaya, MAX_BUKU_TABUNGAN_MB, wajibBukuTabungan } from "@/lib/buku-tabungan";
import { tanggal } from "@/lib/constants";
import { konteksPendaftar } from "@/lib/konteks";

export const metadata = { title: "Buku Tabungan" };

export default async function BukuTabunganPage() {
  const { d } = await konteksPendaftar();
  if (!(await wajibBukuTabungan(d.id))) redirect("/mahasiswa");
  const bt = await bukuTabunganSaya(d.id);

  return (
    <div className="space-y-6">
      <Link href="/mahasiswa" className="text-sm font-medium text-slate-600 hover:text-slate-900">
        ← Kembali ke Mahasiswa
      </Link>
      <BannerPengumuman pendaftaranId={d.id} />
      {bt ? (
        <Card title="Buku tabungan terkirim">
          <Dl
            items={[
              ["Nomor rekening KIP-K", <span key="rek" className="font-mono font-semibold">{bt.noRekening}</span>],
              ["Dikirim", tanggal(bt.createdAt)],
              [
                "Berkas",
                <a key="berkas" href={`/api/buku-tabungan/${bt.id}`} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline">
                  Lihat {bt.mimeType === "application/pdf" ? "PDF" : "foto"} buku tabungan
                </a>,
              ],
            ]}
          />
          <div className="mt-5">
            <Alert tone="info" title="Ada yang salah?">
              Data yang sudah dikirim tidak bisa diubah sendiri. Hubungi admin KIP Kuliah lewat menu{" "}
              <Link href="/bantuan" className="font-semibold underline">
                Bantuan
              </Link>
              . Setelah admin menghapus data lama, formulir ini terbuka lagi.
            </Alert>
          </div>
        </Card>
      ) : (
        <Card title="Isi buku tabungan KIP-K">
          <p className="mb-4 text-sm text-slate-600">Rekening ini dipakai untuk pencairan bantuan KIP Kuliah. Periksa nomor rekening sebelum mengirim: data hanya bisa dikirim sekali.</p>
          <FormBukuTabungan maxMb={MAX_BUKU_TABUNGAN_MB} />
        </Card>
      )}
    </div>
  );
}

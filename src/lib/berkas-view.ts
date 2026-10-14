import type { BerkasRingkas } from "@/components/upload-berkas";

type Row = { id: string; namaAsli: string; mimeType: string; ukuran: number; statusVerifikasi: BerkasRingkas["statusVerifikasi"]; uploadedAt: Date };

/** Ubah baris berkas DB menjadi objek polos yang aman dikirim ke komponen client. */
export function ringkasBerkas(b?: Row): BerkasRingkas | undefined {
  return b && { id: b.id, namaAsli: b.namaAsli, mimeType: b.mimeType, ukuran: b.ukuran, statusVerifikasi: b.statusVerifikasi, uploadedAt: b.uploadedAt.toISOString() };
}

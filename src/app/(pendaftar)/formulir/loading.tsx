import { KerangkaMuat } from "@/components/kerangka-muat";

// Hanya isi langkah yang diganti kerangka; judul dan stepper formulir tetap terlihat.
export default function Loading() {
  return <KerangkaMuat judul={false} baris={6} />;
}

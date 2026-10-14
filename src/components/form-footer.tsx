import Link from "next/link";
import { SubmitButton } from "./form";

/** Footer langkah formulir. Setelah pendaftaran dikirim, menyimpan kembali ke Ringkasan, bukan ke langkah berikutnya. */
export function FormFooter({ back, sudahDikirim }: { back?: string; sudahDikirim: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
      {back ? (
        <Link href={back} className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← Kembali
        </Link>
      ) : (
        <span />
      )}
      <SubmitButton>{sudahDikirim ? "Simpan Perubahan" : "Simpan & Lanjut →"}</SubmitButton>
    </div>
  );
}

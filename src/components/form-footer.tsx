import Link from "next/link";
import { SubmitButton } from "./form";

/**
 * Footer langkah formulir. Setelah pendaftaran dikirim, menyimpan kembali ke Ringkasan, bukan ke langkah berikutnya.
 * Di HP/tablet footer menempel di atas menu bawah supaya tombol Simpan selalu terjangkau tanpa menggulir.
 */
export function FormFooter({ back, sudahDikirim, terkunci }: { back?: string; sudahDikirim: boolean; terkunci?: boolean }) {
  return (
    <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-20 -mx-4 -mb-4 flex items-stretch gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:-mb-5 sm:items-center sm:justify-between sm:px-5 lg:static lg:mx-0 lg:mb-0 lg:gap-3 lg:border-slate-100 lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-5 lg:backdrop-blur-none">
      {back ? (
        <Link href={back} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-medium text-slate-600 ring-1 ring-slate-300 hover:text-slate-900 sm:ring-0">
          ← Kembali
        </Link>
      ) : (
        <span />
      )}
      {terkunci ? (
        <span className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-100 px-5 text-[15px] font-semibold text-slate-500 sm:flex-none">🔒 Data terkunci</span>
      ) : (
        <SubmitButton className="flex-1 sm:flex-none">{sudahDikirim ? "Simpan Perubahan" : "Simpan & Lanjut →"}</SubmitButton>
      )}
    </div>
  );
}

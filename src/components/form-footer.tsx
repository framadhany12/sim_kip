import Link from "next/link";
import { SubmitButton } from "./form";

export function FormFooter({ back, editable, next }: { back?: string; editable: boolean; next?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
      {back ? (
        <Link href={back} className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← Kembali
        </Link>
      ) : (
        <span />
      )}
      {editable ? (
        <SubmitButton>Simpan & Lanjut →</SubmitButton>
      ) : (
        next && (
          <Link href={next} className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50">
            Lanjut →
          </Link>
        )
      )}
    </div>
  );
}

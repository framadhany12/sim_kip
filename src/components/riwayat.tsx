import { labelRiwayat, tanggal } from "@/lib/constants";
import type { PendaftaranLengkap } from "@/lib/pendaftaran";

export function Riwayat({ items }: { items: PendaftaranLengkap["riwayat"] }) {
  return (
    <ol className="relative space-y-5 border-l-2 border-slate-200 pl-6">
      {items.map((r, i) => (
        <li key={r.id} className="relative">
          <span className={`absolute -left-[31px] top-1 size-3.5 rounded-full ring-4 ring-white ${i === 0 ? "bg-blue-700" : "bg-slate-300"}`} />
          <p className="text-sm font-semibold text-slate-900">{labelRiwayat(r.status)}</p>
          {r.catatan && <p className="mt-0.5 whitespace-pre-line text-sm text-slate-700">{r.catatan}</p>}
          <p className="mt-0.5 text-xs text-slate-500">
            {tanggal(r.createdAt)} · oleh {r.role === "admin" ? "Admin" : (r.oleh ?? "Pendaftar")}
          </p>
        </li>
      ))}
    </ol>
  );
}

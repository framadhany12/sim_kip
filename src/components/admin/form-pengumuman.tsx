"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActionForm, FieldShell, SubmitButton, TextArea, inputCls, useFormErrors } from "@/components/form";
import type { FormAction } from "@/lib/form-state";
import type { JenisPengumuman } from "@/lib/pengumuman";

export type BarisKandidat = {
  id: string;
  nama: string;
  nomorKip: string | null;
  nisn: string | null;
  sekolah: string | null;
  tahapLabel: string;
  jurusan1Id: string | null;
  jurusan1: string | null;
  jurusan2Id: string | null;
  jurusan2: string | null;
};

const TEKS: Record<JenisPengumuman, { tombol: string; ringkas: string; gaya: string }> = {
  lolos_administrasi: { tombol: "Umumkan Lolos Administrasi", ringkas: "diumumkan LOLOS Seleksi Administrasi dan masuk Seleksi Ujian", gaya: "primary" },
  selesai_ujian: { tombol: "Tandai Sudah Ujian", ringkas: "ditandai SUDAH MENGIKUTI Seleksi Ujian dan masuk Seleksi Wawancara", gaya: "primary" },
  selesai_wawancara: { tombol: "Tandai Sudah Wawancara", ringkas: "ditandai SUDAH MENGIKUTI Seleksi Wawancara dan masuk tahap Pengusulan", gaya: "primary" },
  administrasi: { tombol: "Umumkan Tidak Lolos", ringkas: "dinyatakan TIDAK LOLOS Seleksi Administrasi", gaya: "danger" },
  ditolak: { tombol: "Umumkan Tidak Diterima", ringkas: "diumumkan TIDAK DITERIMA", gaya: "danger" },
  diterima: { tombol: "Umumkan Diterima", ringkas: "diumumkan DITERIMA", gaya: "success" },
};

/** Isian & daftar pilih-banyak; harus berada di dalam <ActionForm>. */
function Isi({ jenis, rows, opsiAlasan, beasiswa }: { jenis: JenisPengumuman; rows: BarisKandidat[]; opsiAlasan: string[]; beasiswa: { id: string; nama: string }[] }) {
  const state = useFormErrors();
  const [dipilih, setDipilih] = useState<Set<string>>(new Set());
  const [jurusan, setJurusan] = useState<Record<string, string>>({});
  const [alasan, setAlasan] = useState(state?.values?.alasan ?? "");
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [jenisBeasiswa, setJenisBeasiswa] = useState(beasiswa[0]?.id ?? "");
  const semuaRef = useRef<HTMLInputElement>(null);

  // Baris yang sudah diumumkan (hilang dari daftar setelah dimuat ulang) otomatis keluar dari pilihan.
  const ada = useMemo(() => new Set(rows.map((r) => r.id)), [rows]);
  const terpilih = useMemo(() => rows.filter((r) => dipilih.has(r.id) && ada.has(r.id)), [rows, dipilih, ada]);
  const jurusanBaris = (r: BarisKandidat) => jurusan[r.id] ?? r.jurusan1Id ?? "";
  const tanpaJurusan = jenis === "diterima" ? terpilih.filter((r) => !r.jurusan1Id && !r.jurusan2Id) : [];

  useEffect(() => {
    if (semuaRef.current) semuaRef.current.indeterminate = terpilih.length > 0 && terpilih.length < rows.length;
  }, [terpilih.length, rows.length]);
  // Setelah berhasil diumumkan, tutup panel konfirmasi.
  useEffect(() => {
    if (state?.ok) {
      setKonfirmasi(false);
      setDipilih(new Set());
    }
  }, [state]);

  const ubah = (id: string) =>
    setDipilih((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const semua = (on: boolean) => setDipilih(on ? new Set(rows.map((r) => r.id)) : new Set());
  const t = TEKS[jenis];
  const butuhAlasan = opsiAlasan.length > 0;
  // Hanya hasil akhir (diterima / tidak diterima / tidak lolos administrasi) yang bisa dikirim lewat email.
  const bisaEmail = jenis === "diterima" || jenis === "ditolak" || jenis === "administrasi";
  const [kirimEmail, setKirimEmail] = useState(true);

  return (
    <>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">Tidak ada pendaftar yang memenuhi kriteria ini.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input
                    ref={semuaRef}
                    type="checkbox"
                    aria-label="Pilih semua"
                    checked={terpilih.length === rows.length && rows.length > 0}
                    onChange={(e) => semua(e.target.checked)}
                    className="size-4 accent-blue-700"
                  />
                </th>
                <th className="px-3 py-3 font-semibold">Pendaftar</th>
                <th className="px-3 py-3 font-semibold">No. KIP / NISN</th>
                <th className="px-3 py-3 font-semibold">Asal sekolah</th>
                <th className="px-3 py-3 font-semibold">Tahap</th>
                {jenis === "diterima" ? <th className="px-3 py-3 font-semibold">Diterima di jurusan</th> : <th className="px-3 py-3 font-semibold">Pilihan jurusan</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const on = dipilih.has(r.id);
                return (
                  <tr key={r.id} className={on ? "bg-blue-50/60" : "hover:bg-slate-50"}>
                    <td className="px-3 py-2.5">
                      <input type="checkbox" name="ids" value={r.id} checked={on} onChange={() => ubah(r.id)} aria-label={`Pilih ${r.nama}`} className="size-4 accent-blue-700" />
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href={`/admin/pendaftar/${r.id}`} target="_blank" className="font-semibold text-blue-700 hover:underline">
                        {r.nama}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-[13px] text-slate-700">
                      <span className="font-mono">{r.nomorKip ?? "—"}</span>
                      <span className="block font-mono text-slate-500">{r.nisn ?? "—"}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">{r.sekolah ?? "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600">{r.tahapLabel}</td>
                    <td className="px-3 py-2.5">
                      {jenis === "diterima" ? (
                        r.jurusan1Id || r.jurusan2Id ? (
                          <select
                            name={`jurusan:${r.id}`}
                            value={jurusanBaris(r)}
                            onChange={(e) => setJurusan((j) => ({ ...j, [r.id]: e.target.value }))}
                            aria-label={`Jurusan diterima untuk ${r.nama}`}
                            className={`${inputCls} py-1.5 text-[13px]`}
                          >
                            {r.jurusan1Id && <option value={r.jurusan1Id}>Jurusan 1 — {r.jurusan1}</option>}
                            {r.jurusan2Id && <option value={r.jurusan2Id}>Jurusan 2 — {r.jurusan2}</option>}
                          </select>
                        ) : (
                          <span className="text-xs text-rose-700">Belum memilih jurusan</span>
                        )
                      ) : (
                        <span className="text-[13px] text-slate-600">
                          {r.jurusan1 ?? "—"}
                          <span className="block text-slate-400">{r.jurusan2 ?? ""}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
          {butuhAlasan && (
            <FieldShell
              name="alasan"
              label={jenis === "administrasi" ? "Alasan tidak lolos" : "Alasan tidak diterima"}
              required
              error={state?.errors?.alasan}
              hint="Berlaku untuk semua pendaftar yang dipilih."
            >
              <select id="alasan" name="alasan" value={alasan} onChange={(e) => setAlasan(e.target.value)} aria-invalid={!!state?.errors?.alasan} className={inputCls}>
                <option value="">— Pilih alasan —</option>
                {opsiAlasan.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </FieldShell>
          )}
          {jenis === "diterima" && (
            <FieldShell name="jenisBeasiswaId" label="Jenis beasiswa" required error={state?.errors?.jenisBeasiswaId} hint="Berlaku untuk semua pendaftar yang dipilih. Hanya terlihat oleh admin, tidak ditampilkan ke pendaftar.">
              <select id="jenisBeasiswaId" name="jenisBeasiswaId" value={jenisBeasiswa} onChange={(e) => setJenisBeasiswa(e.target.value)} className={inputCls}>
                {beasiswa.length === 0 && <option value="">— Belum ada jenis beasiswa aktif —</option>}
                {beasiswa.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nama}
                  </option>
                ))}
              </select>
            </FieldShell>
          )}
          <TextArea
            name="catatan"
            label="Catatan untuk pendaftar"
            rows={3}
            defaultValue={state?.values?.catatan}
            hint={jenis === "diterima" ? "Mis. petunjuk daftar ulang. Tampil di halaman Status semua yang diumumkan." : jenis === "lolos_administrasi" ? "Mis. jadwal dan lokasi ujian. Tampil di halaman Status semua yang diumumkan." : jenis === "selesai_ujian" ? "Mis. jadwal wawancara. Tampil di halaman Status semua yang diumumkan." : "Opsional. Tampil di halaman Status semua yang diumumkan."}
            className={butuhAlasan ? "" : "md:col-span-2"}
          />
          {bisaEmail && (
            <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 md:col-span-2">
              <input type="checkbox" name="kirimEmail" checked={kirimEmail} onChange={(e) => setKirimEmail(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-blue-700" />
              <span>
                <b className="block text-slate-900">Kirim pengumuman ke email pendaftar</b>
                {jenis === "diterima"
                  ? "Email berisi hasil Diterima beserta program studi tujuannya."
                  : jenis === "ditolak"
                    ? "Email berisi hasil Tidak diterima beserta alasan yang dipilih."
                    : "Email berisi hasil Tidak lolos Seleksi Administrasi beserta alasannya."}{" "}
                Catatan di atas ikut disertakan.
              </span>
            </label>
          )}
        </div>
      )}

      {/* Bilah aksi: lengket di bawah agar tombol selalu terjangkau saat daftar panjang */}
      {rows.length > 0 && (
        <div className="sticky bottom-3 z-20 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
          {!konfirmasi ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600" aria-live="polite">
                <b className="text-slate-900">{terpilih.length}</b> dari {rows.length} pendaftar dipilih
                {terpilih.length > 0 && tanpaJurusan.length > 0 && <span className="ml-2 text-rose-700">· {tanpaJurusan.length} belum punya pilihan jurusan</span>}
              </p>
              <button
                type="button"
                disabled={terpilih.length === 0 || tanpaJurusan.length > 0 || (butuhAlasan && !alasan)}
                onClick={() => setKonfirmasi(true)}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                  t.gaya === "success" ? "bg-emerald-700 hover:bg-emerald-800" : t.gaya === "primary" ? "bg-blue-700 hover:bg-blue-800" : "bg-rose-700 hover:bg-rose-800"
                }`}
              >
                {t.tombol} ({terpilih.length})
              </button>
            </div>
          ) : (
            <div className="space-y-3" role="alertdialog" aria-label="Konfirmasi pengumuman">
              <p className="text-sm text-slate-800">
                <b>{terpilih.length} pendaftar</b> akan {t.ringkas}
                {butuhAlasan && alasan ? <> dengan alasan <b>{alasan}</b></> : null}. Hasil <b>langsung terlihat oleh pendaftar</b>{bisaEmail && kirimEmail ? <> dan <b>dikirim ke email mereka</b></> : null}.
              </p>
              <ul className="max-h-28 overflow-y-auto rounded-lg bg-slate-50 px-3 py-2 text-[13px] text-slate-700">
                {terpilih.map((r) => (
                  <li key={r.id} className="truncate">
                    {r.nama}
                    {jenis === "diterima" && <span className="text-slate-500"> → {r.jurusan1Id === jurusanBaris(r) ? r.jurusan1 : r.jurusan2}</span>}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => setKonfirmasi(false)} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
                  Batal
                </button>
                <SubmitButton variant={t.gaya === "success" ? "success" : t.gaya === "primary" ? "primary" : "danger"}>Ya, umumkan sekarang</SubmitButton>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function FormPengumuman({ jenis, rows, opsiAlasan, beasiswa, action }: { jenis: JenisPengumuman; rows: BarisKandidat[]; opsiAlasan: string[]; beasiswa: { id: string; nama: string }[]; action: FormAction }) {
  return (
    <ActionForm action={action} className="space-y-4">
      <Isi jenis={jenis} rows={rows} opsiAlasan={opsiAlasan} beasiswa={beasiswa} />
    </ActionForm>
  );
}

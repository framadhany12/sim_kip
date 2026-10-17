"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

type Kode = { token: string; sisaMs: number; status: "akan" | "berlangsung" | "selesai" };

/** Layar barcode presensi: kode berganti otomatis; tampilkan di proyektor/layar kegiatan. */
export function BarcodeKegiatan({ kegiatanId, stepDetik }: { kegiatanId: string; stepDetik: number }) {
  const kanvas = useRef<HTMLCanvasElement>(null);
  const [kode, setKode] = useState<Kode | null>(null);
  const [sisa, setSisa] = useState(0);
  const [galat, setGalat] = useState(false);

  useEffect(() => {
    let batal = false;
    let timer: ReturnType<typeof setTimeout>;
    async function muat() {
      try {
        const r = await fetch(`/api/admin/kegiatan/${kegiatanId}/kode`, { cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        const k = (await r.json()) as Kode;
        if (batal) return;
        setKode(k);
        setSisa(k.sisaMs);
        setGalat(false);
        timer = setTimeout(muat, Math.max(1000, k.sisaMs + 300)); // minta kode baru tepat setelah pergantian
      } catch {
        if (batal) return;
        setGalat(true);
        timer = setTimeout(muat, 5000);
      }
    }
    void muat();
    return () => {
      batal = true;
      clearTimeout(timer);
    };
  }, [kegiatanId]);

  useEffect(() => {
    if (!kode || !kanvas.current) return;
    const url = `${location.origin}/mahasiswa/kegiatan/hadir?k=${kegiatanId}&t=${kode.token}`;
    void QRCode.toCanvas(kanvas.current, url, { width: 320, margin: 2, errorCorrectionLevel: "M" });
  }, [kode, kegiatanId]);

  useEffect(() => {
    const id = setInterval(() => setSisa((s) => Math.max(0, s - 250)), 250);
    return () => clearInterval(id);
  }, [kode]);

  if (kode && kode.status !== "berlangsung")
    return (
      <p className="rounded-xl bg-slate-100 p-6 text-center text-sm text-slate-700">
        {kode.status === "akan" ? "Kegiatan belum dimulai. Barcode aktif saat kegiatan berlangsung." : "Kegiatan sudah selesai. Presensi ditutup."}
      </p>
    );

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <canvas ref={kanvas} className="size-[min(80vw,320px)]" aria-label="Barcode presensi kegiatan" />
      </div>
      <div className="w-full max-w-[320px]" aria-hidden>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-blue-600 transition-[width] duration-200 ease-linear" style={{ width: `${Math.min(100, (sisa / (stepDetik * 1000)) * 100)}%` }} />
        </div>
      </div>
      <p className="text-sm text-slate-600">
        {galat ? "Gagal memuat kode, mencoba lagi…" : <>Berganti dalam <b className="tabular-nums">{Math.ceil(sisa / 1000)}</b> detik</>}
      </p>
    </div>
  );
}

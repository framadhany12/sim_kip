"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type Hasil = { tone: "ok" | "info" | "error"; teks: string };

/** Ambil id kegiatan + kode dari isi barcode (URL /mahasiswa/kegiatan/hadir?k=…&t=…). */
export function bacaBarcode(isi: string): { k: string; t: string } | null {
  try {
    const u = new URL(isi);
    const k = u.searchParams.get("k");
    const t = u.searchParams.get("t");
    return u.pathname === "/mahasiswa/kegiatan/hadir" && k && t ? { k, t } : null;
  } catch {
    return null;
  }
}

export async function kirimPresensi(kegiatanId: string, token: string): Promise<Hasil> {
  try {
    const res = await fetch("/api/presensi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kegiatanId, token }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { tone: "error", teks: json.error ?? "Presensi gagal. Coba lagi." };
    return { tone: json.sudah ? "info" : "ok", teks: `${json.message}${json.nama ? ` — ${json.nama}` : ""}` };
  } catch {
    return { tone: "error", teks: "Koneksi terputus. Coba lagi." };
  }
}

const WARNA = { ok: "border-emerald-200 bg-emerald-50 text-emerald-900", info: "border-blue-200 bg-blue-50 text-blue-900", error: "border-rose-200 bg-rose-50 text-rose-900" };

/** Pemindai barcode presensi memakai kamera perangkat. */
export function PindaiPresensi() {
  const video = useRef<HTMLVideoElement>(null);
  const aktif = useRef(false);
  const membuka = useRef(false); // cegah dua permintaan kamera bersamaan (klik ganda)
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [galat, setGalat] = useState("");
  const [menyala, setMenyala] = useState(false);

  const matikan = useCallback(() => {
    aktif.current = false;
    const s = video.current?.srcObject as MediaStream | null;
    s?.getTracks().forEach((t) => t.stop());
    if (video.current) video.current.srcObject = null;
    setMenyala(false);
  }, []);

  const nyalakan = useCallback(async () => {
    if (membuka.current || aktif.current) return;
    membuka.current = true;
    setGalat("");
    setHasil(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setGalat("Kamera tidak tersedia. Buka situs ini lewat HTTPS, atau pindai barcode memakai aplikasi kamera bawaan HP lalu buka tautannya.");
      membuka.current = false;
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      const v = video.current!;
      v.srcObject = stream;
      try {
        await v.play();
      } catch (e) {
        stream.getTracks().forEach((t) => t.stop()); // jangan biarkan lampu kamera menyala bila pemutaran gagal
        v.srcObject = null;
        throw e;
      }
      membuka.current = false;
      aktif.current = true;
      setMenyala(true);

      const Detector = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
      const detektor = Detector ? new Detector({ formats: ["qr_code"] }) : null;
      const kanvas = document.createElement("canvas");
      const ctx = kanvas.getContext("2d", { willReadFrequently: true })!;
      let sibuk = false;

      const baca = async () => {
        if (!aktif.current) return;
        if (!sibuk && v.readyState >= 2 && v.videoWidth) {
          sibuk = true;
          let isi: string | null = null;
          try {
            if (detektor) isi = (await detektor.detect(v))[0]?.rawValue ?? null;
            else {
              kanvas.width = v.videoWidth;
              kanvas.height = v.videoHeight;
              ctx.drawImage(v, 0, 0);
              isi = jsQR(ctx.getImageData(0, 0, kanvas.width, kanvas.height).data, kanvas.width, kanvas.height)?.data ?? null;
            }
          } catch {
            isi = null;
          }
          sibuk = false;
          if (isi) {
            const b = bacaBarcode(isi);
            if (!b) setHasil({ tone: "error", teks: "Barcode ini bukan barcode presensi kegiatan." });
            else {
              matikan();
              setHasil(await kirimPresensi(b.k, b.t));
              return;
            }
          }
        }
        setTimeout(baca, 250);
      };
      void baca();
    } catch {
      membuka.current = false;
      setGalat("Kamera tidak dapat dibuka. Izinkan akses kamera di browser, lalu coba lagi.");
    }
  }, [matikan]);

  useEffect(() => matikan, [matikan]);

  return (
    <div className="space-y-4">
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-black">
        <video ref={video} playsInline muted className="size-full object-cover" />
        {!menyala && <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-white/70">Kamera mati</div>}
        {menyala && <div aria-hidden className="pointer-events-none absolute inset-8 rounded-xl border-2 border-white/70" />}
      </div>
      <div className="flex justify-center">
        {menyala ? (
          <button type="button" onClick={matikan} className="rounded-lg px-5 py-2.5 text-[15px] font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50">
            Hentikan
          </button>
        ) : (
          <button type="button" onClick={nyalakan} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-gradient-to-b from-[#2563eb] to-[#1646a0] px-5 py-2.5 text-[15px] font-semibold text-white shadow-sm hover:brightness-110">
            {hasil ? "Pindai lagi" : "Mulai Pindai"}
          </button>
        )}
      </div>
      {galat && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          {galat}
        </p>
      )}
      {hasil && (
        <p role="status" className={`rounded-lg border p-3 text-sm font-medium ${WARNA[hasil.tone]}`}>
          {hasil.teks}
        </p>
      )}
    </div>
  );
}

/** Halaman tujuan bila barcode dibuka lewat aplikasi kamera bawaan HP: langsung mencatat kehadiran. */
export function CatatKehadiran({ kegiatanId, token }: { kegiatanId: string; token: string }) {
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const jalan = useRef(false);
  useEffect(() => {
    if (jalan.current) return;
    jalan.current = true;
    void kirimPresensi(kegiatanId, token).then(setHasil);
  }, [kegiatanId, token]);
  return hasil ? (
    <p role="status" className={`rounded-lg border p-4 text-sm font-medium ${WARNA[hasil.tone]}`}>
      {hasil.teks}
    </p>
  ) : (
    <p className="text-sm text-slate-600">Mencatat kehadiran…</p>
  );
}

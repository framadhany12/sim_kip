"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";

const JEDA_KETIK_MS = 300;
const TEKS = new Set(["text", "search", "number", "tel", "email"]);

/**
 * Formulir filter yang langsung berlaku tanpa tombol "Terapkan": ketikan di kolom teks diterapkan setelah jeda singkat,
 * pilihan di daftar/tanggal langsung. Isian disalin ke query string (nilai kosong dibuang, halaman kembali ke 1).
 * Formulir tetap terpasang selama daftar dimuat, jadi kursor tidak hilang saat mengetik.
 */
export function FormFilter({ children, className }: { children: ReactNode; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sekarang = useSearchParams().toString();
  const [pending, mulai] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const terakhir = useRef(sekarang);
  const [versi, setVersi] = useState(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  // URL berubah bukan dari formulir ini (tautan Reset, tombol kembali): pasang ulang formulir agar isiannya ikut URL.
  useEffect(() => {
    if (sekarang !== terakhir.current) {
      terakhir.current = sekarang;
      setVersi((v) => v + 1);
    }
  }, [sekarang]);

  function terapkan() {
    window.clearTimeout(timer.current);
    const form = ref.current;
    if (!form) return;
    const p = new URLSearchParams();
    for (const [k, v] of new FormData(form)) if (typeof v === "string" && v.trim() !== "") p.set(k, v.trim());
    const qs = p.toString();
    terakhir.current = qs;
    mulai(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    // Pemulih transisi (lihat pemulih-transisi.tsx) ikut mengawasi navigasi yang tidak lewat klik.
    window.dispatchEvent(new Event("kip:navigasi"));
  }

  const kolomTeks = (el: EventTarget) => el instanceof HTMLInputElement && TEKS.has(el.type);

  function onInput(e: FormEvent<HTMLFormElement>) {
    if (!kolomTeks(e.target) || (e.nativeEvent as InputEvent).isComposing) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(terapkan, JEDA_KETIK_MS);
  }

  return (
    <form
      key={versi}
      ref={ref}
      role="search"
      method="get"
      aria-busy={pending}
      className={className}
      onInput={onInput}
      onChange={(e) => {
        if (!kolomTeks(e.target)) terapkan();
      }}
      onSubmit={(e) => {
        e.preventDefault();
        terapkan();
      }}
    >
      {children}
    </form>
  );
}

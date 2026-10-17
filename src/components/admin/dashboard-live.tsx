"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, CheckCircle2, ClipboardCheck, FileClock, RefreshCw, UserPlus, UserX, Users, XCircle, type LucideIcon } from "lucide-react";
import type { Statistik } from "@/lib/statistik";

// ---- Token warna grafik (palet tervalidasi: slot kategori + status) --------------------------------
const C = {
  s1: "#2a78d6", // seri 1 (biru)
  s2: "#eb6834", // seri 2 (oranye)
  s3: "#1baf7a", // seri 3 (aqua)
  good: "#0ca30c",
  critical: "#d03b3b",
  serious: "#ec835a",
  netral: "#c3c2b7",
  grid: "#e1e0d9",
  muted: "#898781",
  ink2: "#52514e",
};
const INTERVAL_MS = 30_000;
const fmt = new Intl.NumberFormat("id-ID");
const tglPendek = (s: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${s}T00:00:00Z`));
const tglPanjang = (s: string) => new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${s}T00:00:00Z`));

function relatif(iso: string, now: number) {
  const d = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (d < 60) return `${d} dtk lalu`;
  if (d < 3600) return `${Math.floor(d / 60)} mnt lalu`;
  if (d < 86400) return `${Math.floor(d / 3600)} jam lalu`;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(iso));
}

// ---- Data & pembaruan otomatis -------------------------------------------------------------------
function useStatistikLive(awal: Statistik) {
  const [data, setData] = useState(awal);
  const [tahun, setTahun] = useState(awal.tahun ? String(awal.tahun) : "semua");
  const [hari, setHari] = useState(awal.hari);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState(false);
  const [jeda, setJeda] = useState(false);
  // Awal memakai waktu dari server agar render server dan klien sama (hindari galat hydration); lalu berdetak tiap detik.
  const [now, setNow] = useState(() => Date.parse(awal.diperbarui));
  const urut = useRef(0);
  // Selama admin tidak memilih tahun lain, dashboard mengikuti tahun berjalan (berpindah sendiri saat tahun berganti).
  const ikutiTahunBerjalan = useRef(awal.tahun === awal.tahunBerjalan);
  const ubahTahun = useCallback((t: string) => {
    ikutiTahunBerjalan.current = false; // pilihan manual admin dihormati
    setTahun(t);
  }, []);

  const muat = useCallback(async () => {
    const saya = ++urut.current; // hanya respons terbaru yang dipakai (filter bisa berganti saat permintaan berjalan)
    setMemuat(true);
    try {
      const r = await fetch(`/api/admin/statistik?tahun=${encodeURIComponent(tahun)}&hari=${hari}`, { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      const json = (await r.json()) as Statistik;
      if (saya !== urut.current) return;
      setData(json);
      setGalat(false);
      if (ikutiTahunBerjalan.current && String(json.tahunBerjalan) !== tahun) setTahun(String(json.tahunBerjalan)); // pergantian tahun
    } catch {
      if (saya === urut.current) setGalat(true);
    } finally {
      if (saya === urut.current) setMemuat(false);
    }
  }, [tahun, hari]);

  // Muat ulang saat filter berubah, lalu berkala selama tab terlihat.
  useEffect(() => {
    setJeda(document.visibilityState !== "visible");
    void muat();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void muat();
    }, INTERVAL_MS);
    const onVis = () => {
      setJeda(document.visibilityState !== "visible");
      if (document.visibilityState === "visible") void muat();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [muat]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return { data, tahun, ubahTahun, hari, setHari, memuat, galat, jeda, now, muat };
}

/** Menandai sebentar nilai yang baru berubah (agar pembaruan langsung terlihat). */
function useBerubah(nilai: number) {
  const lalu = useRef(nilai);
  const [kilat, setKilat] = useState(false);
  useEffect(() => {
    if (lalu.current !== nilai) {
      lalu.current = nilai;
      setKilat(true);
      const t = setTimeout(() => setKilat(false), 1600);
      return () => clearTimeout(t);
    }
  }, [nilai]);
  return kilat;
}

// ---- Komponen kecil -------------------------------------------------------------------------------
function Panel({ title, sub, children, aksi, className = "" }: { title: string; sub?: string; children: ReactNode; aksi?: ReactNode; className?: string }) {
  return (
    <section className={`flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-2 px-5 pt-4">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
        </div>
        {aksi}
      </header>
      <div className="flex-1 px-5 pb-4 pt-3">{children}</div>
    </section>
  );
}

function TabelData({ kolom, baris }: { kolom: string[]; baris: (string | number)[][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-800">Tampilkan sebagai tabel</summary>
      <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-[13px]">
          <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
            <tr>
              {kolom.map((k, i) => (
                <th key={k} className={`px-3 py-2 font-semibold ${i ? "text-right" : ""}`}>
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {baris.map((b, i) => (
              <tr key={i}>
                {b.map((v, j) => (
                  <td key={j} className={`px-3 py-1.5 text-slate-700 ${j ? "text-right tabular-nums" : ""}`}>
                    {typeof v === "number" ? fmt.format(v) : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function Kpi({ label, nilai, ikon: Ikon, ket, href, nada = "biru" }: { label: string; nilai: number; ikon: LucideIcon; ket: ReactNode; href?: string; nada?: "biru" | "hijau" | "merah" | "abu" | "kuning" }) {
  const kilat = useBerubah(nilai);
  const warna = {
    biru: "bg-blue-50 text-blue-700",
    hijau: "bg-emerald-50 text-emerald-700",
    merah: "bg-rose-50 text-rose-700",
    abu: "bg-slate-100 text-slate-600",
    kuning: "bg-amber-50 text-amber-700",
  }[nada];
  const isi = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-600">{label}</p>
        <span className={`grid size-9 place-items-center rounded-lg ${warna}`}>
          <Ikon className="size-[18px]" strokeWidth={1.9} aria-hidden />
        </span>
      </div>
      <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-slate-900">{fmt.format(nilai)}</p>
      <p className="mt-2 text-xs text-slate-500">{ket}</p>
    </>
  );
  const cls = `block rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition ${
    kilat ? "border-blue-400 ring-4 ring-blue-100" : "border-slate-200"
  } ${href ? "hover:border-blue-300" : ""}`;
  return href ? (
    <Link href={href} className={cls}>
      {isi}
    </Link>
  ) : (
    <div className={cls}>{isi}</div>
  );
}

type EntriTooltip = { dataKey?: unknown; value?: unknown; name?: unknown; color?: string; payload?: { fill?: unknown } };
type PropsTooltip = { active?: boolean; payload?: readonly EntriTooltip[]; label?: unknown };
/** Teruskan hanya properti yang dipakai (tipe bawaan Recharts terlalu ketat untuk komponen generik). */
const tt = (p: PropsTooltip) => ({ active: p.active, payload: p.payload, label: p.label });

/** Tooltip seragam: nilai di depan (tebal), nama seri di belakang, kunci berupa garis pendek. */
function TooltipIsi({ active, payload, label, judul }: PropsTooltip & { judul?: (l: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      {label != null && <p className="mb-1 font-medium text-slate-500">{judul ? judul(String(label)) : String(label)}</p>}
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={String(p.dataKey)} className="flex items-center gap-2">
            <span className="h-0.5 w-3 rounded" style={{ background: (p.payload?.fill as string) ?? p.color }} aria-hidden />
            <b className="text-sm text-slate-900 tabular-nums">{fmt.format(Number(p.value))}</b>
            <span className="text-slate-500">{String(p.name ?? "")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const sumbu = { fontSize: 12, fill: C.muted } as const;

/** Legenda HTML dengan urutan tetap sesuai urutan seri (legenda bawaan Recharts mengurutkan menurut abjad). */
function Legenda({ item }: { item: { nama: string; warna: string; bentuk: "garis" | "kotak" }[] }) {
  return (
    <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
      {item.map((i) => (
        <li key={i.nama} className="flex items-center gap-1.5">
          <span aria-hidden className={i.bentuk === "garis" ? "h-0.5 w-3.5 rounded" : "size-2.5 rounded-sm"} style={{ background: i.warna }} />
          {i.nama}
        </li>
      ))}
    </ul>
  );
}

function BarHorizontal({ data, seri, tinggiBaris = 34 }: { data: Record<string, string | number>[]; seri: { key: string; nama: string; warna: string }[]; tinggiBaris?: number }) {
  const tinggi = Math.max(120, data.length * tinggiBaris * (seri.length > 1 ? 1.35 : 1) + 10);
  return (
    <>
      {seri.length > 1 && <Legenda item={seri.map((s) => ({ nama: s.nama, warna: s.warna, bentuk: "kotak" }))} />}
    <div style={{ height: tinggi }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barGap={2} barCategoryGap="22%">
          <CartesianGrid horizontal={false} stroke={C.grid} />
          <XAxis type="number" allowDecimals={false} tick={sumbu} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="nama" width={150} tick={{ ...sumbu, fill: C.ink2 }} axisLine={{ stroke: C.netral }} tickLine={false} />
          <Tooltip cursor={{ fill: "rgba(42,120,214,0.06)" }} content={(p) => <TooltipIsi {...tt(p)} />} />
          {seri.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.nama} fill={s.warna} maxBarSize={20} radius={[0, 4, 4, 0]} animationDuration={500} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
    </>
  );
}

// ---- Dashboard -------------------------------------------------------------------------------------
export function DashboardLive({ awal }: { awal: Statistik }) {
  const { data, tahun, ubahTahun, hari, setHari, memuat, galat, jeda, now, muat } = useStatistikLive(awal);
  const k = data.kpi;
  // Tautan kartu membawa tahun yang dipilih agar daftar yang terbuka sama dengan angkanya.
  const thn = `&tahun=${tahun}`; // "semua" harus eksplisit: tanpa parameter, daftar bawaannya tahun berjalan

  const komposisi = useMemo(
    () =>
      [
        { nama: "Dalam proses seleksi", n: k.proses, warna: C.s1 },
        { nama: "Diterima", n: k.diterima, warna: C.good },
        { nama: "Tidak diterima", n: k.tidakDiterima, warna: C.critical },
        { nama: "Tidak lolos administrasi", n: k.gugurAdministrasi, warna: C.serious },
        { nama: "Belum mengirim", n: k.belumKirim, warna: C.netral },
      ].filter((x) => x.n > 0),
    [k],
  );
  const totalKomposisi = komposisi.reduce((a, x) => a + x.n, 0);
  const totalTren = data.tren.reduce((a, t) => ({ akun: a.akun + t.akun, kirim: a.kirim + t.kirim }), { akun: 0, kirim: 0 });
  const pctSelesai = k.masuk ? Math.round(((k.diterima + k.tidakDiterima + k.gugurAdministrasi) / k.masuk) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Judul + status langsung */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">Ringkasan pendaftaran KIP Kuliah Politeknik TEDC Bandung.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-medium ring-1 ring-inset ${
              galat ? "bg-rose-50 text-rose-700 ring-rose-200" : jeda ? "bg-slate-100 text-slate-600 ring-slate-200" : "bg-emerald-50 text-emerald-800 ring-emerald-200"
            }`}
            role="status"
          >
            <span className="relative flex size-2">
              {!galat && !jeda && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:hidden" />}
              <span className={`relative inline-flex size-2 rounded-full ${galat ? "bg-rose-500" : jeda ? "bg-slate-400" : "bg-emerald-500"}`} />
            </span>
            {galat ? "Gagal memuat, mencoba lagi…" : jeda ? "Dijeda (tab tidak aktif)" : "Langsung"} · diperbarui {relatif(data.diperbarui, now)}
          </span>
          <button
            onClick={() => void muat()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
            aria-label="Perbarui sekarang"
          >
            <RefreshCw className={`size-3.5 ${memuat ? "animate-spin" : ""}`} aria-hidden /> Perbarui
          </button>
        </div>
      </div>

      {/* Filter: satu baris, berlaku untuk semua angka & grafik di bawahnya */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <label htmlFor="f-tahun" className="text-xs font-medium text-slate-500">
          Tahun daftar
        </label>
        <select
          id="f-tahun"
          value={tahun}
          onChange={(e) => ubahTahun(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
        >
          <option value="semua">Semua tahun</option>
          {data.pilihanTahun.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" aria-hidden />
        <span id="f-rentang" className="text-xs font-medium text-slate-500">
          Rentang tren
        </span>
        <div role="radiogroup" aria-labelledby="f-rentang" className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {[7, 14, 30, 90].map((h) => (
            <button
              key={h}
              role="radio"
              aria-checked={hari === h}
              onClick={() => setHari(h)}
              className={`rounded-md px-3 py-1 text-sm font-medium ${hari === h ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"}`}
            >
              {h} hari
            </button>
          ))}
        </div>
      </div>

      <div className={`space-y-6 transition-opacity ${memuat ? "opacity-80" : "opacity-100"}`}>
        {/* KPI */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Kpi label="Akun pendaftar" nilai={k.akun} ikon={Users} ket={<>+{fmt.format(k.akunHariIni)} hari ini · {fmt.format(k.akunTerverifikasi)} terverifikasi</>} />
          <Kpi label="Pendaftaran masuk" nilai={k.masuk} ikon={ClipboardCheck} ket={<>+{fmt.format(k.kirimHariIni)} dikirim hari ini</>} href={`/admin/pendaftar?status=semua${thn}`} />
          <Kpi label="Dalam proses seleksi" nilai={k.proses} ikon={Activity} ket="Belum ada keputusan akhir" href={`/admin/pendaftar?status=masuk${thn}`} />
          <Kpi label="Diterima" nilai={k.diterima} ikon={CheckCircle2} ket="Hasil pengumuman" href={`/admin/pendaftar?status=diterima${thn}`} nada="hijau" />
          <Kpi
            label="Tidak diterima / lolos"
            nilai={k.tidakDiterima + k.gugurAdministrasi}
            ikon={XCircle}
            ket={<>{fmt.format(k.gugurAdministrasi)} gugur di administrasi</>}
            href={`/admin/pendaftar?status=ditolak${thn}`}
            nada="merah"
          />
          <Kpi label="Belum mengirim" nilai={k.belumKirim} ikon={FileClock} ket="Masih mengisi formulir" href={`/admin/pendaftar?status=draft${thn}`} nada="abu" />
        </div>

        {/* Tren + komposisi */}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Panel
            title="Tren pendaftaran harian"
            sub={`${hari} hari terakhir · ${fmt.format(totalTren.akun)} akun baru, ${fmt.format(totalTren.kirim)} pendaftaran dikirim`}
          >
            <Legenda
              item={[
                { nama: "Akun baru", warna: C.s1, bentuk: "garis" },
                { nama: "Pendaftaran dikirim", warna: C.s2, bentuk: "garis" },
              ]}
            />
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.tren} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                  <defs>
                    {[
                      ["g-akun", C.s1],
                      ["g-kirim", C.s2],
                    ].map(([id, c]) => (
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity={0.16} />
                        <stop offset="100%" stopColor={c} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid vertical={false} stroke={C.grid} />
                  <XAxis dataKey="tanggal" tickFormatter={tglPendek} tick={sumbu} axisLine={{ stroke: C.netral }} tickLine={false} minTickGap={24} />
                  <YAxis allowDecimals={false} tick={sumbu} axisLine={false} tickLine={false} width={40} />
                  <Tooltip cursor={{ stroke: C.netral, strokeWidth: 1 }} content={(p) => <TooltipIsi {...tt(p)} judul={tglPanjang} />} />
                  <Area type="linear" dataKey="akun" name="Akun baru" stroke={C.s1} strokeWidth={2} fill="url(#g-akun)" dot={false} activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }} animationDuration={500} />
                  <Area type="linear" dataKey="kirim" name="Pendaftaran dikirim" stroke={C.s2} strokeWidth={2} fill="url(#g-kirim)" dot={false} activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }} animationDuration={500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <TabelData kolom={["Tanggal", "Akun baru", "Dikirim"]} baris={[...data.tren].reverse().map((t) => [tglPanjang(t.tanggal), t.akun, t.kirim])} />
          </Panel>

          <Panel title="Komposisi status" sub={`${fmt.format(totalKomposisi)} pendaftaran · ${pctSelesai}% sudah ada hasil akhir`}>
            {totalKomposisi === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">Belum ada pendaftaran.</p>
            ) : (
              <div className="flex flex-col items-center gap-5">
                <div className="relative size-[180px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={komposisi}
                        dataKey="n"
                        nameKey="nama"
                        innerRadius={58}
                        outerRadius={86}
                        paddingAngle={komposisi.length > 1 ? 2 : 0}
                        stroke="#fff"
                        strokeWidth={2}
                        // Animasi Pie macet bila data diperbarui berkala; tanpa animasi donut selalu tergambar.
                        isAnimationActive={false}
                      >
                        {komposisi.map((x) => (
                          <Cell key={x.nama} fill={x.warna} />
                        ))}
                      </Pie>
                      <Tooltip content={(p) => <TooltipIsi {...tt(p)} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                    <div>
                      <p className="text-2xl font-semibold text-slate-900">{fmt.format(totalKomposisi)}</p>
                      <p className="text-[11px] text-slate-500">pendaftaran</p>
                    </div>
                  </div>
                </div>
                <ul className="w-full space-y-2 text-sm">
                  {komposisi.map((x) => (
                    <li key={x.nama} className="flex items-center gap-2.5">
                      <span className="size-2.5 shrink-0 rounded-sm" style={{ background: x.warna }} aria-hidden />
                      <span className="flex-1 text-slate-600">{x.nama}</span>
                      <b className="tabular-nums text-slate-900">{fmt.format(x.n)}</b>
                      <span className="w-10 text-right text-xs tabular-nums text-slate-400">{Math.round((x.n / totalKomposisi) * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
        </div>

        {/* Tahap + aktivitas */}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Panel title="Pendaftar per tahap seleksi" sub="Yang masih berproses (belum diumumkan)">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.perTahap} margin={{ top: 16, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid vertical={false} stroke={C.grid} />
                  <XAxis dataKey="label" tick={{ ...sumbu, fill: C.ink2 }} axisLine={{ stroke: C.netral }} tickLine={false} interval={0} />
                  <YAxis allowDecimals={false} tick={sumbu} axisLine={false} tickLine={false} width={40} />
                  <Tooltip cursor={{ fill: "rgba(42,120,214,0.06)" }} content={(p) => <TooltipIsi {...tt(p)} />} />
                  <Bar
                    dataKey="n"
                    name="Pendaftar"
                    fill={C.s1}
                    maxBarSize={24}
                    radius={[4, 4, 0, 0]}
                    animationDuration={500}
                    label={{ position: "top", fontSize: 12, fill: C.ink2 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {data.perTahap.map((t) => (
                <Link key={t.tahap} href={`/admin/pendaftar?status=tahap:${t.tahap}${thn}`} className="rounded-md border border-slate-200 px-2 py-1 text-slate-600 hover:border-blue-300 hover:text-blue-700">
                  Lihat {t.label} →
                </Link>
              ))}
            </div>
          </Panel>

          <Panel
            title="Aktivitas terbaru"
            sub="Perubahan status & data pendaftar"
            aksi={
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden /> langsung
              </span>
            }
          >
            {data.aktivitas.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">Belum ada aktivitas.</p>
            ) : (
              <ol className="max-h-[296px] space-y-3 overflow-y-auto pr-1">
                {data.aktivitas.map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <span className={`mt-1 grid size-7 shrink-0 place-items-center rounded-full ${a.olehAdmin ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`} aria-hidden>
                      {a.olehAdmin ? <ClipboardCheck className="size-3.5" /> : <UserPlus className="size-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate">
                        <Link href={`/admin/pendaftar/${a.pendaftaranId}`} className="font-semibold text-slate-900 hover:text-blue-700 hover:underline">
                          {a.nama}
                        </Link>
                      </p>
                      <p className="truncate text-[13px] text-slate-600">{a.catatan?.split("\n")[0] || a.label}</p>
                      <p className="text-[11px] text-slate-400">
                        {a.label} · {relatif(a.waktu, now)} · oleh {a.olehAdmin ? "Admin" : "Pendaftar"}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        {/* Jurusan */}
        <Panel title="Peminat & penerimaan per jurusan" sub="Pendaftaran yang sudah dikirim">
          <BarHorizontal
            data={data.jurusan}
            seri={[
              { key: "p1", nama: "Jurusan 1", warna: C.s1 },
              { key: "p2", nama: "Jurusan 2", warna: C.s2 },
              { key: "diterima", nama: "Diterima", warna: C.s3 },
            ]}
          />
          <TabelData kolom={["Jurusan", "Jurusan 1", "Jurusan 2", "Diterima"]} baris={data.jurusan.map((j) => [j.nama, j.p1, j.p2, j.diterima])} />
        </Panel>

        {/* Profil pendaftar */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Sebaran desil" sub="Tingkat kesejahteraan (DTSEN)">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.desil} margin={{ top: 16, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid vertical={false} stroke={C.grid} />
                  <XAxis dataKey="label" tickFormatter={(l: string) => l.replace("Desil ", "D")} tick={{ ...sumbu, fill: C.ink2 }} axisLine={{ stroke: C.netral }} tickLine={false} interval={0} />
                  <YAxis allowDecimals={false} tick={sumbu} axisLine={false} tickLine={false} width={40} />
                  <Tooltip cursor={{ fill: "rgba(42,120,214,0.06)" }} content={(p) => <TooltipIsi {...tt(p)} />} />
                  <Bar dataKey="n" name="Pendaftar" fill={C.s1} maxBarSize={24} radius={[4, 4, 0, 0]} animationDuration={500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <TabelData kolom={["Desil", "Pendaftar"]} baris={data.desil.map((d) => [d.label, d.n])} />
          </Panel>
          <Panel title="Sumber rekomendasi" sub="Dari mana pendaftar mengetahui KIP Kuliah">
            <BarHorizontal data={data.rekomendasi} seri={[{ key: "n", nama: "Pendaftar", warna: C.s1 }]} />
            <TabelData kolom={["Sumber", "Pendaftar"]} baris={data.rekomendasi.map((r) => [r.nama, r.n])} />
          </Panel>
          <Panel title="Asal daerah teratas" sub="Kabupaten/kota sesuai Kartu Keluarga">
            {data.kabupaten.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">Belum ada data.</p>
            ) : (
              <BarHorizontal data={data.kabupaten} seri={[{ key: "n", nama: "Pendaftar", warna: C.s1 }]} />
            )}
            <TabelData kolom={["Kabupaten/Kota", "Pendaftar"]} baris={data.kabupaten.map((r) => [r.nama, r.n])} />
          </Panel>
        </div>

        {k.pertanyaanBaru > 0 && (
          <Link href="/admin/pertanyaan" className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:bg-amber-100">
            <UserX className="size-4" aria-hidden /> {k.pertanyaanBaru} pertanyaan pendaftar belum dijawab →
          </Link>
        )}
      </div>
    </div>
  );
}

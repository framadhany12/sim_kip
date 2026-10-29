/** Baris kredit aplikasi di bagian bawah halaman. `gelap` untuk latar biru tua (di dalam footer landing page, jadi tanpa elemen footer sendiri). */
export function KreditAplikasi({ gelap = false, className = "" }: { gelap?: boolean; className?: string }) {
  const tahun = new Date().getFullYear();
  const Tag = gelap ? "div" : "footer";
  return (
    <Tag
      className={`flex flex-col items-center gap-1 text-center text-xs leading-relaxed sm:flex-row sm:justify-between sm:text-left ${
        gelap ? "text-blue-200/80" : "border-t border-slate-200 pt-5 text-slate-500"
      } ${className}`}
    >
      <p>
        © {tahun} <span className={`font-semibold ${gelap ? "text-white" : "text-slate-700"}`}>SIM KIP Politeknik TEDC</span>
        <span className="hidden sm:inline"> · Sistem Informasi KIP Kuliah</span>
      </p>
      <p>
        Dibuat oleh <span className={`font-semibold ${gelap ? "text-[#f5c400]" : "text-slate-700"}`}>Faishal Ramadhany Sukandar</span>
      </p>
    </Tag>
  );
}

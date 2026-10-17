/** Isi halaman muncul dengan geser-pudar singkat setiap pindah menu (lihat .halaman-masuk di globals.css). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="halaman-masuk">{children}</div>;
}

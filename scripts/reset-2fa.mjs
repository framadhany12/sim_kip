// Mengatur ulang authenticator seorang admin (mis. satu-satunya admin kehilangan ponsel dan kode pemulihan).
// Pemakaian: npm run admin:reset-2fa -- <email>
// Pada login berikutnya admin tersebut diminta memasang authenticator baru.
import { bukaDatabase } from "./db.mjs";

const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!email) {
  console.error("Pemakaian: npm run admin:reset-2fa -- <email>");
  process.exit(1);
}
const { conn } = await bukaDatabase();
const [rows] = await conn.execute("select id from users where email = ? and role = 'admin'", [email]);
if (!rows.length) {
  console.error(`Admin dengan email ${email} tidak ditemukan.`);
  await conn.end();
  process.exit(1);
}
const id = rows[0].id;
await conn.execute("update users set totp_secret = null, totp_aktif = 0, totp_langkah = null where id = ?", [id]);
await conn.execute("delete from kode_pemulihan where user_id = ?", [id]);
await conn.execute("delete from sessions where user_id = ?", [id]);
console.log(`Authenticator ${email} diatur ulang. Ia akan diminta memasangnya lagi saat login.`);
await conn.end();

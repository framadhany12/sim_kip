// Membuat (atau memperbarui) akun admin.
// Pemakaian: npm run admin:buat -- <email> <kata-sandi> ["Nama Admin"]
// Bila email sudah terdaftar, kata sandinya diganti dan perannya dijadikan admin.
import { randomBytes, randomUUID, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { bukaDatabase } from "./db.mjs";

const [email, password, nama = "Administrator"] = process.argv.slice(2);
if (!email || !password) {
  console.error('Pemakaian: npm run admin:buat -- <email> <kata-sandi> ["Nama Admin"]');
  process.exit(1);
}
if (password.length < 8) {
  console.error("Kata sandi minimal 8 karakter.");
  process.exit(1);
}

// Format hash harus sama dengan src/lib/password.ts
const salt = randomBytes(16);
const hash = await promisify(scrypt)(password, salt, 64);
const passwordHash = `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;

const { conn } = await bukaDatabase();
const login = email.trim().toLowerCase();
const [ada] = await conn.execute("select id from users where email = ?", [login]);
if (ada.length) {
  await conn.execute("update users set password_hash = ?, role = 'admin', nama = ?, email_verified_at = coalesce(email_verified_at, ?) where email = ?", [passwordHash, nama, new Date(), login]);
  console.log(`Akun ${login} diperbarui menjadi admin.`);
} else {
  await conn.execute("insert into users (id, nama, email, password_hash, role, email_verified_at, created_at) values (?, ?, ?, ?, 'admin', ?, ?)", [
    randomUUID(),
    nama,
    login,
    passwordHash,
    new Date(),
    new Date(),
  ]);
  console.log(`Akun admin ${login} dibuat.`);
}
await conn.end();

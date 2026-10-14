import { randomInt } from "node:crypto";

const ALFABET_SANDI = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; // tanpa huruf/angka yang mirip (I, l, 1, O, 0)

/** Sandi acak 12 karakter yang pasti memuat huruf dan angka. */
export function buatSandiAcak() {
  for (;;) {
    const s = Array.from({ length: 12 }, () => ALFABET_SANDI[randomInt(ALFABET_SANDI.length)]).join("");
    if (/[a-zA-Z]/.test(s) && /\d/.test(s)) return s;
  }
}

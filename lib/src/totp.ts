const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function randomBase32(length = 20): string {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => ALPHABET[n % 32]).join("");
}

function base32Bytes(input: string): Uint8Array {
  let bits = "";
  for (const char of input.toUpperCase().replace(/[^A-Z2-7]/g, "")) {
    bits += ALPHABET.indexOf(char).toString(2).padStart(5, "0");
  }
  const out: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(Number.parseInt(bits.slice(i, i + 8), 2));
  return new Uint8Array(out);
}

export async function totpCode(secret: string, at = Date.now()): Promise<string> {
  const counter = Math.floor(at / 30_000);
  const buffer = new ArrayBuffer(8);
  new DataView(buffer).setUint32(4, counter);
  const raw = base32Bytes(secret);
  const copy = new Uint8Array(raw.byteLength);
  copy.set(raw);
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    copy,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await globalThis.crypto.subtle.sign("HMAC", key, buffer));
  const offset = sig[sig.length - 1] & 0x0f;
  const bin =
    ((sig[offset] & 0x7f) << 24) |
    ((sig[offset + 1] & 0xff) << 16) |
    ((sig[offset + 2] & 0xff) << 8) |
    (sig[offset + 3] & 0xff);
  return String(bin % 1_000_000).padStart(6, "0");
}

export async function totpMatches(secret: string, code: string): Promise<boolean> {
  const clean = code.replace(/\D/g, "");
  if (clean.length !== 6) return false;
  const now = Date.now();
  for (const skew of [-30_000, 0, 30_000]) {
    if ((await totpCode(secret, now + skew)) === clean) return true;
  }
  return false;
}

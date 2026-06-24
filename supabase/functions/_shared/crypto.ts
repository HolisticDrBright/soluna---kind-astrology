// Column encryption for sensitive fields (e.g. full birth name).
// AES-256-GCM via Web Crypto. APP_ENCRYPTION_KEY is base64(32 bytes).
// Stored value = base64( iv(12) || ciphertext+tag ). Plaintext is never stored.

let keyPromise: Promise<CryptoKey> | null = null;

function getKey(): Promise<CryptoKey> {
  if (keyPromise) return keyPromise;
  keyPromise = (async () => {
    const b64 = Deno.env.get("APP_ENCRYPTION_KEY");
    if (!b64) throw new Error("APP_ENCRYPTION_KEY is not set");
    const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    if (raw.length !== 32) throw new Error("APP_ENCRYPTION_KEY must decode to 32 bytes");
    return await crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
      "encrypt",
      "decrypt",
    ]);
  })();
  return keyPromise;
}

export async function encryptField(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(plaintext);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0);
  out.set(ct, iv.length);
  return btoa(String.fromCharCode(...out));
}

export async function decryptField(stored: string): Promise<string> {
  const key = await getKey();
  const bytes = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
  const iv = bytes.slice(0, 12);
  const ct = bytes.slice(12);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}

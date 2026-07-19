// Edge-safe admin session signing/verification (Web Crypto only — no next/headers).
// Used by both middleware (edge runtime) and server route handlers.

export const ADMIN_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours (seconds)

const SECRET = process.env.AUTH_SECRET || "dev-insecure-admin-secret-change-me";

export interface AdminSession {
  id: string;
  email: string;
  name: string;
  exp: number; // epoch ms
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function strToB64url(str: string): string {
  return bytesToB64url(enc.encode(str));
}

function b64urlToBytes(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function sign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return bytesToB64url(new Uint8Array(sig));
}

// Constant-time string comparison.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(admin: { id: string; email: string; name: string }): Promise<string> {
  const payload: AdminSession = {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    exp: Date.now() + ADMIN_SESSION_MAX_AGE * 1000,
  };
  const body = strToB64url(JSON.stringify(payload));
  const sig = await sign(body);
  return `${body}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<AdminSession | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = await sign(body);
  if (!safeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(dec.decode(b64urlToBytes(body))) as AdminSession;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

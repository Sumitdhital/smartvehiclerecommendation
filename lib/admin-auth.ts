// Server-side admin auth helpers (route handlers + server components).
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  AdminSession,
  createSessionToken,
  verifySessionToken,
} from "./admin-session";

// Read + verify the current admin session from the request cookies.
export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

// For API routes: returns the session, or null if unauthenticated.
export async function requireAdmin(): Promise<AdminSession | null> {
  return getAdminSession();
}

// Standard 401 response for protected API routes.
export function unauthorized() {
  return NextResponse.json({ error: "Not authorized. Please sign in as an admin." }, { status: 401 });
}

// Attach a signed session cookie to a response.
export async function attachSessionCookie(
  res: NextResponse,
  admin: { id: string; email: string; name: string }
): Promise<NextResponse> {
  const token = await createSessionToken(admin);
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  return res;
}

// Clear the session cookie on a response.
export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getReadyDb } from "./db";
import { getUserBySessionToken, type PublicUser } from "./repo";

export const SESSION_COOKIE = "ajaia_session";
export const SESSION_TTL_DAYS = 30;

export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = await getReadyDb();
  return getUserBySessionToken(db, token);
});

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

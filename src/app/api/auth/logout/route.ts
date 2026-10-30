import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionToken } from "@/lib/auth";
import { getReadyDb } from "@/lib/db";
import { deleteSession } from "@/lib/repo";

export async function POST() {
  const token = await getSessionToken();
  if (token) {
    const db = await getReadyDb();
    await deleteSession(db, token);
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

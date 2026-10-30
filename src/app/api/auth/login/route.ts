import { NextResponse } from "next/server";
import { ApiError, jsonError, parseJson } from "@/lib/api";
import { SESSION_TTL_DAYS, setSessionCookie } from "@/lib/auth";
import { verifyPassword } from "@/lib/crypto";
import { getReadyDb } from "@/lib/db";
import { createSession, findUserByEmail } from "@/lib/repo";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const { email, password } = await parseJson(request, loginSchema);
    const db = await getReadyDb();
    const user = await findUserByEmail(db, email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new ApiError(401, "invalid_credentials", "Email or password is incorrect.");
    }

    const { token, expiresAt } = await createSession(db, user.id, SESSION_TTL_DAYS);
    await setSessionCookie(token, expiresAt);

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, color: user.color },
    });
  } catch (error) {
    return jsonError(error);
  }
}

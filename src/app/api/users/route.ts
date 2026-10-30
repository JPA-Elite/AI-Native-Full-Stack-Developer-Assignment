import { NextResponse } from "next/server";
import { apiUser, jsonError } from "@/lib/api";
import { getReadyDb } from "@/lib/db";
import { listWorkspaceUsers } from "@/lib/repo";

export async function GET() {
  try {
    await apiUser();
    const db = await getReadyDb();
    return NextResponse.json({ users: await listWorkspaceUsers(db) });
  } catch (error) {
    return jsonError(error);
  }
}

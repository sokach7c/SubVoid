import { NextResponse } from "next/server";
import {
  createAuthToken,
  validateAdminCredentials,
} from "@/lib/auth";

export const runtime = "nodejs";

interface LoginPayload {
  username?: unknown;
  password?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const payload = (await request.json().catch(() => ({}))) as LoginPayload;
  const username = typeof payload.username === "string" ? payload.username : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!validateAdminCredentials(username, password)) {
    return NextResponse.json(
      { message: "Invalid username or password." },
      { status: 401 }
    );
  }

  const token = await createAuthToken({ username });

  return NextResponse.json({ ok: true, token });
}

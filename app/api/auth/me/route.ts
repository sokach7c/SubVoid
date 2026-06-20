import { NextResponse } from "next/server";
import { verifyRequestAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await verifyRequestAuth(request);

  if (!auth) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: { username: auth.username },
  });
}

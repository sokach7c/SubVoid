import { NextResponse } from "next/server";
import { verifyRequestAuth } from "@/lib/auth";
import {
  deleteRemoteConfig,
  updateRemoteConfig,
} from "@/lib/events/repository";
import { parseRemoteConfigInput } from "@/lib/subconverter/validators";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(
  request: Request,
  context: RouteContext
): Promise<NextResponse> {
  const auth = await verifyRequestAuth(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const input = parseRemoteConfigInput(await request.json().catch(() => null));
  if (!input) {
    return NextResponse.json(
      { message: "A valid remote config payload is required." },
      { status: 400 }
    );
  }

  const { id } = await context.params;
  const remoteConfig = updateRemoteConfig(id, input);

  if (!remoteConfig) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ remoteConfig });
}

export async function DELETE(
  request: Request,
  context: RouteContext
): Promise<NextResponse> {
  const auth = await verifyRequestAuth(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = deleteRemoteConfig(id);

  if (!deleted) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

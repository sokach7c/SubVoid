import { NextResponse } from "next/server";
import { verifyRequestAuth } from "@/lib/auth";
import {
  createRemoteConfig,
  listRemoteConfigs,
} from "@/lib/events/repository";
import { parseRemoteConfigInput } from "@/lib/subconverter/validators";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await verifyRequestAuth(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const enabledOnly = url.searchParams.get("enabledOnly") === "true";

  return NextResponse.json({
    remoteConfigs: listRemoteConfigs({ enabledOnly }),
  });
}

export async function POST(request: Request): Promise<NextResponse> {
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

  return NextResponse.json(
    { remoteConfig: createRemoteConfig(input) },
    { status: 201 }
  );
}

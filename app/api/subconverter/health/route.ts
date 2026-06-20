import { NextResponse } from "next/server";
import { verifyRequestAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await verifyRequestAuth(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const backend = url.searchParams.get("backend");

  if (!backend) {
    return NextResponse.json(
      { status: "unknown", message: "Backend URL is required." },
      { status: 400 }
    );
  }

  try {
    const versionUrl = getBackendVersionUrl(backend);
    const startedAt = Date.now();
    const response = await fetch(versionUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - startedAt;
    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          status: "down",
          message: `HTTP ${response.status}`,
          latencyMs,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      version: formatVersion(text),
      latencyMs,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "down",
        message: error instanceof Error ? error.message : "Health check failed.",
      },
      { status: 502 }
    );
  }
}

function getBackendVersionUrl(backend: string): string {
  const parsedUrl = new URL(backend);
  const pathWithoutSub = parsedUrl.pathname.replace(/\/sub\/?$/, "");
  parsedUrl.pathname = `${pathWithoutSub}/version`.replace(/\/{2,}/g, "/");
  parsedUrl.search = "";
  parsedUrl.hash = "";

  return parsedUrl.toString();
}

function formatVersion(version: string): string {
  return version.replace(/backend\n$/gm, "").replace("subconverter", "").trim();
}

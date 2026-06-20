import { withCurrentAdmin } from "@/features/clash/local/lib/api-auth";
import { apiError, json, readJsonBody } from "@/features/clash/local/lib/http";
import { importSourceUrlDirect } from "@/features/clash/local/lib/source-import";
import { buildSourceImportParseResult } from "@subboost/server-core/subscription";

export async function POST(request: Request) {
  return withCurrentAdmin(request, async () => {
    const body = await readJsonBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return apiError("Invalid JSON body.", "BAD_REQUEST", 400);
    }
    const payload = body as Record<string, unknown>;
    const url = typeof payload.url === "string" ? payload.url.trim() : "";
    if (!url) return apiError("URL is required.", "BAD_REQUEST", 400);

    const result = await importSourceUrlDirect({
      url,
      ...(typeof payload.userinfoUrl === "string" ? { userinfoUrl: payload.userinfoUrl } : {}),
      ...(typeof payload.userinfoUserAgent === "string" ? { userinfoUserAgent: payload.userinfoUserAgent } : {}),
    });

    if (!result.ok) {
      return json(
        {
          ok: false,
          error: result.error,
          errorInfo: result.errorInfo,
          responseStatus: result.responseStatus,
          publicReason: result.publicReason,
        },
        400
      );
    }

    return json({
      ok: true,
      content: result.content,
      headers: result.headers,
      parseResult: buildSourceImportParseResult({
        parsedNodes: result.parsedNodes,
        parseErrors: result.parseErrors,
      }),
    });
  });
}

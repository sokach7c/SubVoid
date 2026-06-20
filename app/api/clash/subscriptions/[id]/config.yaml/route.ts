import { apiError } from "@/features/clash/local/lib/http";
import { generateSubscriptionYaml } from "@/features/clash/local/lib/subscription-service";
import { buildSubscriptionResponseHeaders } from "@subboost/server-core/subscription";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  // Intentionally public: the route id is the unguessable subscription token
  // used by Clash clients, so this endpoint must work without a login session.
  const { id } = await params;
  const result = await generateSubscriptionYaml(id);
  if (!result) return apiError("Subscription YAML not found.", "NOT_FOUND", 404);
  return new Response(result.yaml, {
    headers: buildSubscriptionResponseHeaders(result.name, result.subscriptionInfo, {
      cacheControl: "no-store",
      cacheExpirySeconds: result.cacheExpirySeconds,
      autoUpdateIntervalSeconds: result.autoUpdateIntervalSeconds,
      isAdmin: result.isAdmin,
    }),
  });
}

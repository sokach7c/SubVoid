import {
  createSubscriptionResponse,
  listSubscriptionsResponse,
} from "@/features/clash/local/lib/subscription-route-handlers";

export async function GET(request: Request) {
  return listSubscriptionsResponse(request);
}

export async function POST(request: Request) {
  return createSubscriptionResponse(request);
}

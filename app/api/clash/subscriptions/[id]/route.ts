import {
  deleteSubscriptionResponse,
  getSubscriptionResponse,
  updateSubscriptionResponse,
} from "@/features/clash/local/lib/subscription-route-handlers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return getSubscriptionResponse(request, id);
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return updateSubscriptionResponse(request, id);
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return deleteSubscriptionResponse(request, id);
}

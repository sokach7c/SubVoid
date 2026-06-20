import { getOptionalCurrentAdmin } from "@/features/clash/local/lib/api-auth";
import { apiError, json } from "@/features/clash/local/lib/http";
import { getTemplateDetail } from "@/features/clash/local/lib/template-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const admin = await getOptionalCurrentAdmin(request);
  try {
    const template = await getTemplateDetail(admin?.id ?? null, id);
    if (!template) return apiError("Template not found.", "NOT_FOUND", 404);
    return json({ template });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Unable to load template.", "BAD_REQUEST", 400);
  }
}

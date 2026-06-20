import { getCurrentAdmin, type CurrentAdmin } from "@/features/clash/local/lib/auth";
import { apiError } from "@/features/clash/local/lib/http";

type AdminResponseHandler = (admin: CurrentAdmin) => Response | Promise<Response>;

export function localAdminRequiredResponse(): Response {
  return apiError("Authentication required.", "UNAUTHORIZED", 401);
}

export async function getOptionalCurrentAdmin(request?: Request): Promise<CurrentAdmin | null> {
  return getCurrentAdmin(request);
}

export async function withCurrentAdmin(request: Request, handler: AdminResponseHandler): Promise<Response> {
  const admin = await getCurrentAdmin(request);
  if (!admin) return localAdminRequiredResponse();
  return handler(admin);
}

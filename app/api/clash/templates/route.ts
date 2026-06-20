import { getOptionalCurrentAdmin, withCurrentAdmin } from "@/features/clash/local/lib/api-auth";
import { apiError, json, readJsonBody } from "@/features/clash/local/lib/http";
import { createTemplate, deleteTemplate, listTemplates } from "@/features/clash/local/lib/template-service";

function parseTab(value: string | null): "default" | "my" {
  return value === "my" ? "my" : "default";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const admin = await getOptionalCurrentAdmin(request);
  const type = parseTab(url.searchParams.get("type"));
  const ids = url.searchParams.getAll("id").map((item) => item.trim()).filter(Boolean);

  try {
    return json({ templates: await listTemplates(admin?.id ?? null, type, ids) });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Unable to list templates.", "BAD_REQUEST", 400);
  }
}

export async function POST(request: Request) {
  return withCurrentAdmin(request, async (admin) => {
    const body = await readJsonBody(request);
    if (!body) return apiError("Invalid JSON body.", "BAD_REQUEST", 400);
    try {
      return json({ template: await createTemplate(admin.id, body) }, 201);
    } catch (error) {
      return apiError(error instanceof Error ? error.message : "Unable to create template.", "BAD_REQUEST", 400);
    }
  });
}

export async function DELETE(request: Request) {
  return withCurrentAdmin(request, async (admin) => {
    const id = new URL(request.url).searchParams.get("id")?.trim() || "";
    if (!id) return apiError("Template id is required.", "BAD_REQUEST", 400);
    const deleted = await deleteTemplate(admin.id, id);
    if (!deleted) return apiError("Template not found.", "NOT_FOUND", 404);
    return json({ success: true });
  });
}

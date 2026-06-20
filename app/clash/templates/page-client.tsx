"use client";

import { ClashEmbeddedShell } from "@/components/app/clash-embedded-shell";
import {
  TemplateLibrarySurface,
  type TemplateLibraryAdapter,
} from "@subboost/ui/templates/template-library-surface";
import { readJsonResponse } from "@subboost/ui/product/client-response";
import type { TabValue, Template } from "@subboost/ui/templates/types";
import { getAuthHeaders } from "@/lib/auth-storage";

type TemplateListResponse = {
  templates?: Template[];
  error?: string;
};

type TemplateDetailResponse = {
  template?: {
    kind?: string;
    config?: unknown;
  };
  error?: string;
};

const adapter: TemplateLibraryAdapter = {
  enabledTabs: { default: true, catalog: false, my: true },
  allowUpload: true,
  allowEngagement: false,
  allowDelete: true,
  allowPublicTemplates: false,
  uploadSearchParam: false,
  loadTemplates: async (tab: TabValue) => {
    const data = await readJsonResponse<TemplateListResponse>(
      await fetch(`/api/clash/templates?type=${encodeURIComponent(tab)}`, {
        cache: "no-store",
        headers: getAuthHeaders(),
      })
    );
    return Array.isArray(data.templates) ? data.templates : [];
  },
  loadTemplateDetail: async (id: string) => {
    const response = await fetch(`/api/clash/templates/${encodeURIComponent(id)}`, {
      cache: "no-store",
      headers: getAuthHeaders(),
    });
    if (response.status === 404) return null;
    const data = await readJsonResponse<TemplateDetailResponse>(response);
    return data.template ?? null;
  },
  uploadTemplate: async (payload) => {
    await readJsonResponse(
      await fetch("/api/clash/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      })
    );
  },
  deleteTemplate: async (id: string) => {
    await readJsonResponse(
      await fetch(`/api/clash/templates?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
    );
  },
};

export function ClashTemplatesPageClient() {
  return (
    <ClashEmbeddedShell>
      <TemplateLibrarySurface adapter={adapter} />
    </ClashEmbeddedShell>
  );
}

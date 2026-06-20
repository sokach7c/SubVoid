"use client";

import { ClashEmbeddedShell } from "@/components/app/clash-embedded-shell";
import { HomeSurface, type HomeSurfaceAdapter } from "@subboost/ui/product/home/home-surface";
import { readSourceImportResponse } from "@subboost/ui/product/client-response";
import { createRulesProductApi } from "@subboost/ui/product/api-adapter";
import { getAuthHeaders } from "@/lib/auth-storage";

const adapter: HomeSurfaceAdapter = {
  loginHref: "/login",
  templateUploadHref: null,
  productApi: {
    sourceImport: {
      importSource: async (request) => {
        const data = await readSourceImportResponse(
          await fetch("/api/clash/source-import", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify(request),
          })
        );
        return {
          content: typeof data.content === "string" ? data.content : "",
          headers: data.headers || {},
          parseResult: data.parseResult,
        };
      },
    },
    templates: {
      catalogEnabled: false,
      builtinEngagementEnabled: false,
    },
    rules: createRulesProductApi(),
  },
  loadSubscription: (id) =>
    fetch(`/api/clash/subscriptions/${encodeURIComponent(id)}`, {
      cache: "no-store",
      headers: getAuthHeaders(),
    }),
  subscription: {
    loginHref: "/login",
    saveSubscription: ({ isEditing, subscriptionId, payload }) => {
      const endpoint =
        isEditing && subscriptionId
          ? `/api/clash/subscriptions/${encodeURIComponent(subscriptionId)}`
          : "/api/clash/subscriptions";
      return fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
    },
  },
};

export function ClashHomePageClient() {
  return (
    <ClashEmbeddedShell>
      <HomeSurface adapter={adapter} />
    </ClashEmbeddedShell>
  );
}

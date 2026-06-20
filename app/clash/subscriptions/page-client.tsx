"use client";

import { ClashEmbeddedShell } from "@/components/app/clash-embedded-shell";
import {
  SubscriptionDashboardSurface,
  type DashboardSurfaceAdapter,
} from "@subboost/ui/dashboard/subscription-dashboard-surface";
import { readJsonResponse } from "@subboost/ui/product/client-response";
import type { RefreshSubscriptionResponse, Subscription } from "@subboost/ui/dashboard/dashboard-types";
import { getAuthHeaders } from "@/lib/auth-storage";

const adapter: DashboardSurfaceAdapter = {
  loginHref: "/login",
  newSubscriptionHref: "/clash?newSubscription=1",
  templatesHref: "/clash/templates",
  fetchSubscriptions: async () => {
    const response = await fetch("/api/clash/subscriptions", { headers: getAuthHeaders() });
    const data = await readJsonResponse<{ subscriptions?: Subscription[]; error?: string }>(response, "获取订阅失败");
    return Array.isArray(data.subscriptions) ? data.subscriptions : [];
  },
  deleteSubscription: async (id) => {
    await readJsonResponse(
      await fetch(`/api/clash/subscriptions/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      }),
      "删除失败"
    );
  },
  refreshSubscription: async (id) => {
    const data = await readJsonResponse<RefreshSubscriptionResponse>(
      await fetch(`/api/clash/subscriptions/${encodeURIComponent(id)}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      }),
      "刷新失败"
    );
    return data;
  },
  updateSubscriptionSettings: async (id, payload) => {
    await readJsonResponse(
      await fetch(`/api/clash/subscriptions/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      }),
      "保存失败"
    );
  },
};

export function ClashSubscriptionsPageClient() {
  return (
    <ClashEmbeddedShell>
      <SubscriptionDashboardSurface adapter={adapter} />
    </ClashEmbeddedShell>
  );
}

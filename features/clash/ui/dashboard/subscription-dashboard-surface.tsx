// @ts-nocheck
"use client";

import * as React from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  Download,
  FileCode,
  MoreVertical,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Trash2,
} from "@/features/clash/ui/icons";

import { Button } from "@subboost/ui/components/ui/button";
import { confirmDialog } from "@subboost/ui/components/ui/confirm-dialog";
import { toast } from "@subboost/ui/components/ui/toaster";
import { useUserStore, type User } from "@subboost/ui/store/user-store";
import type { AutoUpdateIntervalPolicyOverride } from "@subboost/core/subscription/auto-update-interval";
import { formatDashboardDate } from "@subboost/ui/dashboard/dashboard-format";
import { buildRefreshSubscriptionSuccessToast } from "@subboost/ui/dashboard/dashboard-refresh-toast";
import { SubscriptionSettingsDialog } from "@subboost/ui/dashboard/subscription-settings-dialog";
import type { RefreshSubscriptionResponse, Subscription } from "@subboost/ui/dashboard/dashboard-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type UpdateSettingsPayload = {
  name: string;
  smartNodeMatchingEnabled: boolean;
  autoUpdateInterval: number | null;
};

export type DashboardSurfaceAdapter = {
  loginHref?: string;
  newSubscriptionHref?: string;
  templatesHref?: string | null;
  settingsHref?: string | null;
  settingsTitle?: string;
  settingsDescription?: string;
  autoUpdateIntervalPolicy?: AutoUpdateIntervalPolicyOverride;
  editSubscriptionHref?: (subscription: Subscription) => string;
  fetchSubscriptions: () => Promise<Subscription[]>;
  deleteSubscription: (id: string) => Promise<void>;
  refreshSubscription: (id: string) => Promise<RefreshSubscriptionResponse>;
  updateSubscriptionSettings: (id: string, payload: UpdateSettingsPayload) => Promise<void>;
  resolveDownloadUrl?: (subscription: Subscription) => string;
  renderAnnouncement?: (context: { user: User }) => React.ReactNode;
  renderHeaderActions?: (context: { user: User }) => React.ReactNode;
  renderExtraQuickActions?: (context: { user: User }) => React.ReactNode;
  beforeStatsSlot?: React.ReactNode;
};

type Props = {
  adapter: DashboardSurfaceAdapter;
};

function buildYamlDownloadFilename(name: string): string {
  const base =
    String(name || "subboost-config")
      .trim()
      .replace(/[\r\n]/g, " ")
      .replace(/[<>:"/\\|?*]+/g, "")
      .replace(/\s+/g, "_")
      .replace(/\.(?:ya?ml)$/i, "")
      .slice(0, 80) || "subboost-config";
  return `${base}.yaml`;
}

function triggerBrowserDownload(href: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

export function SubscriptionDashboardSurface({ adapter }: Props) {
  const { user, isLoading: userLoading, fetchUser } = useUserStore();
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [refreshingId, setRefreshingId] = React.useState<string | null>(null);

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsSub, setSettingsSub] = React.useState<Subscription | null>(null);
  const [settingsName, setSettingsName] = React.useState("");
  const [smartNodeMatchingEnabled, setSmartNodeMatchingEnabled] = React.useState(true);
  const [savingSettings, setSavingSettings] = React.useState(false);

  React.useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const fetchSubscriptions = React.useCallback(async () => {
    try {
      const nextSubscriptions = await adapter.fetchSubscriptions();
      setSubscriptions(nextSubscriptions);
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
      setSubscriptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [adapter]);

  React.useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    void fetchSubscriptions();
  }, [user, fetchSubscriptions]);

  const copyToClipboard = async (subscriptionUrl: string, id: string) => {
    const copied = await copyText(subscriptionUrl);
    if (!copied) {
      toast({ title: "复制失败，请手动复制订阅链接", variant: "destructive" });
      return;
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadSubscription = async (subscription: Subscription) => {
    const filename = buildYamlDownloadFilename(subscription.name);
    try {
      const response = await fetch(adapter.resolveDownloadUrl?.(subscription) ?? subscription.subscriptionUrl);
      if (!response.ok) throw new Error(`Download failed with status ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      triggerBrowserDownload(objectUrl, filename);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch (error) {
      console.error("Failed to fetch subscription YAML for download:", error);
      toast({
        title: "下载失败",
        description: "请刷新页面后重试，或先复制订阅链接到代理软件。",
        variant: "destructive",
      });
    }
  };

  const deleteSubscription = async (id: string) => {
    const ok = await confirmDialog({
      title: "确定要删除这个订阅吗？",
      confirmText: "删除",
      variant: "destructive",
    });
    if (!ok) return;

    try {
      await adapter.deleteSubscription(id);
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete subscription:", error);
      toast({ title: "删除失败，请稍后重试", variant: "destructive" });
    }
  };

  const refreshSubscription = async (id: string) => {
    if (refreshingId) return;
    setRefreshingId(id);
    try {
      const data = await adapter.refreshSubscription(id);
      await fetchSubscriptions();
      toast(buildRefreshSubscriptionSuccessToast(data));
    } catch (error) {
      console.error("Failed to refresh subscription:", error);
      toast({ title: error instanceof Error ? error.message : "刷新失败，请稍后重试", variant: "destructive" });
    } finally {
      setRefreshingId(null);
    }
  };

  const openSubscriptionSettings = (sub: Subscription) => {
    setSettingsSub(sub);
    setSettingsName(sub.name);
    setSmartNodeMatchingEnabled(sub.smartNodeMatchingEnabled !== false);
    setSettingsOpen(true);
  };

  const saveSubscriptionSettings = async () => {
    if (!settingsSub || savingSettings) return;

    const name = settingsName.trim();
    if (!name || name.length > 100) {
      toast({ title: "订阅名称不能为空且长度不能超过 100 字符", variant: "warning" });
      return;
    }

    const nextAutoUpdateInterval = null;
    setSavingSettings(true);
    try {
      await adapter.updateSubscriptionSettings(settingsSub.id, {
        name,
        smartNodeMatchingEnabled,
        autoUpdateInterval: nextAutoUpdateInterval,
      });

      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === settingsSub.id
            ? {
                ...s,
                name,
                smartNodeMatchingEnabled,
                autoUpdateInterval: nextAutoUpdateInterval,
                autoUpdateState: {
                  externalFailureCount: 0,
                  failureSourceState: null,
                  lastFailedAt: null,
                  lastAttemptedAt: null,
                  disabledAt: null,
                  disabledReason: null,
                  disabledPreviousInterval: null,
                },
              }
            : s
        )
      );
      setSettingsOpen(false);
    } catch (error) {
      console.error("Failed to save subscription settings:", error);
      toast({ title: error instanceof Error ? error.message : "保存失败，请稍后重试", variant: "destructive" });
    } finally {
      setSavingSettings(false);
    }
  };

  if (userLoading) return <DashboardSkeleton />;
  if (!user) return <LoginPrompt loginHref={adapter.loginHref ?? "/login"} />;

  const newSubscriptionHref = adapter.newSubscriptionHref ?? "/?newSubscription=1";
  const editSubscriptionHref = adapter.editSubscriptionHref ?? ((sub: Subscription) => `/?editSubscriptionId=${sub.id}`);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="border-b border-border px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">我的订阅</h1>
            <p className="truncate text-xs text-muted-foreground">管理 Clash 订阅链接和已保存配置。</p>
          </div>
          <div className="flex items-center gap-2">
            {adapter.renderHeaderActions?.({ user })}
            <Link href={newSubscriptionHref}>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                新建订阅
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {adapter.renderAnnouncement?.({ user })}
        {adapter.beforeStatsSlot}

        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-md border border-border px-2 py-1">订阅数：{subscriptions.length}/{user.quota.maxSubscriptions}</span>
          <span className="rounded-md border border-border px-2 py-1">模板数：{user.templateCount}/{user.quota.maxCustomTemplates}</span>
        </div>

        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead className="min-w-[220px]">订阅链接</TableHead>
                <TableHead className="w-32">创建时间</TableHead>
                <TableHead className="w-32">更新时间</TableHead>
                <TableHead className="w-20">智能匹配</TableHead>
                <TableHead className="w-[264px] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    正在加载订阅...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && subscriptions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    暂无订阅。
                  </TableCell>
                </TableRow>
              )}
              {subscriptions.map((sub) => (
                <SubscriptionRow
                  key={sub.id}
                  sub={sub}
                  copiedId={copiedId}
                  refreshingId={refreshingId}
                  editHref={editSubscriptionHref(sub)}
                  onCopy={copyToClipboard}
                  onDelete={deleteSubscription}
                  onDownload={downloadSubscription}
                  onRefresh={refreshSubscription}
                  onSettings={openSubscriptionSettings}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <SubscriptionSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        subscription={settingsSub}
        settingsName={settingsName}
        setSettingsName={setSettingsName}
        smartNodeMatchingEnabled={smartNodeMatchingEnabled}
        setSmartNodeMatchingEnabled={setSmartNodeMatchingEnabled}
        savingSettings={savingSettings}
        onSave={saveSubscriptionSettings}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="border-b border-border px-4 py-3 md:px-6">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-56 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex-1 p-4 md:p-6">
        <div className="rounded-md border border-border p-3">
          <div className="h-8 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-8 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-8 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

function LoginPrompt({ loginHref }: { loginHref: string }) {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <Shield className="h-16 w-16 mx-auto text-white/50" />
        <h1 className="text-2xl font-bold">请先登录</h1>
        <p className="text-white/50">登录后可以管理您的订阅和模板</p>
        <Link href={loginHref}>
          <Button size="lg">登录</Button>
        </Link>
      </div>
    </div>
  );
}

function SubscriptionRow({
  sub,
  copiedId,
  refreshingId,
  editHref,
  onCopy,
  onDelete,
  onDownload,
  onRefresh,
  onSettings,
}: {
  sub: Subscription;
  copiedId: string | null;
  refreshingId: string | null;
  editHref: string;
  onCopy: (subscriptionUrl: string, id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDownload: (sub: Subscription) => Promise<void>;
  onRefresh: (id: string) => Promise<void>;
  onSettings: (sub: Subscription) => void;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex min-w-0 items-center gap-2">
          <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="max-w-[240px] truncate">{sub.name}</span>
        </div>
      </TableCell>
      <TableCell className="max-w-[360px] truncate font-mono text-xs text-muted-foreground">
        {sub.subscriptionUrl}
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDashboardDate(sub.createdAt)}</TableCell>
      <TableCell className="text-muted-foreground">{formatDashboardDate(sub.lastUpdatedAt)}</TableCell>
      <TableCell>
        <span className={sub.smartNodeMatchingEnabled !== false ? "text-green-500" : "text-muted-foreground"}>
          {sub.smartNodeMatchingEnabled !== false ? "启用" : "停用"}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
        <Link href={editHref}>
          <Button variant="ghost" size="icon-sm" title="回到首页编辑该订阅（更新后链接不变）" aria-label="编辑订阅">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onSettings(sub)}
          title="订阅设置"
          aria-label="订阅设置"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => void onRefresh(sub.id)}
          disabled={refreshingId === sub.id}
          title="重新生成配置并刷新缓存"
          aria-label="刷新订阅"
        >
          <RefreshCw className={`h-4 w-4 ${refreshingId === sub.id ? "animate-spin" : ""}`} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => void onCopy(sub.subscriptionUrl, sub.id)}
          title="复制订阅链接"
          aria-label="复制订阅链接"
        >
          {copiedId === sub.id ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => void onDownload(sub)}
          title="下载订阅配置"
          aria-label="下载订阅配置"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => void onDelete(sub.id)}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          title="删除订阅"
          aria-label="删除订阅"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      </TableCell>
    </TableRow>
  );
}

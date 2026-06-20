// @ts-nocheck
"use client";

import * as React from "react";
import Link from "next/link";
import {
  Download,
  AlertTriangle,
  ExternalLink,
  Eye,
  Loader2,
  Settings2,
  Upload,
  Zap,
} from "@/features/clash/ui/icons";
import { Button } from "@subboost/ui/components/ui/button";
import { Card, CardContent, CardFooter } from "@subboost/ui/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@subboost/ui/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@subboost/ui/components/ui/tabs";
import { QuickMode } from "@subboost/ui/product/converter/quick-mode";
import { AdvancedMode } from "@subboost/ui/product/converter/advanced-mode";
import { UnsavedPrompt } from "@subboost/ui/product/home/unsaved-prompt";
import { VisualGraph } from "@subboost/ui/product/preview/visual-graph";
import { YamlHighlight } from "@subboost/ui/product/preview/diff-highlight";
import { SubscriptionLinkDialog } from "@subboost/ui/product/home/subscription-link-dialog";
import { useProductInteractionAdapter, type ProductMode } from "@subboost/ui/product/interactions";
import type { User } from "@subboost/ui/store/user-store";
import type { AutoUpdateIntervalPolicy } from "@subboost/core/subscription/auto-update-interval";
import { SidebarTrigger } from "@/components/ui/sidebar";

type EditingSubscription = {
  id: string;
  token: string;
  name: string;
  autoUpdateInterval: number | null;
  smartNodeMatchingEnabled: boolean;
};

type SubscriptionLinkState = {
  subscriptionDialog: boolean;
  setSubscriptionDialog: (open: boolean) => void;
  subscriptionName: string;
  setSubscriptionName: (value: string) => void;
  subscriptionUrl: string;
  autoUpdateEnabled: boolean;
  setAutoUpdateEnabled: (value: boolean) => void;
  autoUpdateHours: number;
  setAutoUpdateHours: (value: number) => void;
  autoUpdatePolicy: AutoUpdateIntervalPolicy;
  smartNodeMatchingEnabled: boolean;
  setSmartNodeMatchingEnabled: (value: boolean) => void;
  isCreatingSubscription: boolean;
  copied: boolean;
  saveRequirementDialog: boolean;
  setSaveRequirementDialog: (open: boolean) => void;
  isEditingExistingSubscription: boolean;
  handleGenerateSubscription: (mode: ProductMode) => void;
  handleAcceptSaveRequirement: () => void;
  handleCreateSubscription: () => void;
  handleCopyUrl: () => void;
};

type Props = {
  user: User | null;
  authChecked: boolean;

  editingSubscription: EditingSubscription | null;
  isLoadingEditingSubscription: boolean;
  editSubscriptionId: string | null;

  generatedYaml: string;
  generatedYamlError: string | null;
  configLoading: boolean;
  hasValidSources: boolean;

  handleGenerate: (mode: ProductMode) => void;
  handleDownload: (mode: ProductMode) => void;

  subscription: SubscriptionLinkState;
  noticeSlot?: React.ReactNode;
  renderAnnouncement?: (context: {
    placement: "home" | "advanced";
    authChecked: boolean;
    user: User | null;
  }) => React.ReactNode;
  saveRequirementSlot?: React.ReactNode;
  templateUploadHref?: string | null;
  onTemplateUploadOpen?: () => void;
};

const DESKTOP_PANEL_MIN_HEIGHT_CLASS = "lg:min-h-0";
const DESKTOP_PANEL_CONTENT_MIN_HEIGHT_CLASS = "lg:min-h-0";

export function HomeLayout({
  user,
  authChecked,
  editingSubscription,
  isLoadingEditingSubscription,
  editSubscriptionId,
  generatedYaml,
  generatedYamlError,
  configLoading,
  hasValidSources,
  handleGenerate,
  handleDownload,
  subscription,
  noticeSlot,
  renderAnnouncement,
  saveRequirementSlot,
  templateUploadHref = null,
  onTemplateUploadOpen,
}: Props) {
  const [advancedDialogOpen, setAdvancedDialogOpen] = React.useState(false);
  const [lastGeneratedMode, setLastGeneratedMode] = React.useState<ProductMode>(
    editSubscriptionId ? "advanced" : "quick",
  );
  const interactions = useProductInteractionAdapter();

  React.useEffect(() => {
    if (!editSubscriptionId) return;
    setLastGeneratedMode("advanced");
  }, [editSubscriptionId]);

  const runGenerate = React.useCallback((mode: ProductMode) => {
    setLastGeneratedMode(mode);
    interactions.modeChanged?.({ mode });
    handleGenerate(mode);
  }, [handleGenerate, interactions]);

  const openAdvancedDialog = React.useCallback(() => {
    setAdvancedDialogOpen(true);
    interactions.modeChanged?.({ mode: "advanced" });
  }, [interactions]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="shrink-0" />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">配置生成</h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              生成、预览并保存 Clash 配置
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isLoadingEditingSubscription && editSubscriptionId && (
            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-[10px] text-indigo-100/90">
              <Loader2 className="h-3 w-3 animate-spin" />
              加载订阅中
            </span>
          )}
          {editingSubscription && (
            <span className="hidden max-w-[16rem] truncate rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-[10px] text-indigo-100/90 sm:inline-block">
              编辑中：{editingSubscription.name}
            </span>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4 md:p-5">
        {renderAnnouncement?.({
          placement: advancedDialogOpen ? "advanced" : "home",
          authChecked,
          user,
        })}

        {noticeSlot}

        <div className={`flex min-h-[calc(100vh-7.5rem)] w-full flex-col gap-4 lg:h-full lg:min-h-0 lg:flex-row ${DESKTOP_PANEL_MIN_HEIGHT_CLASS}`}>
        {/* Left Column - Preview */}
        <div
          id="preview"
          className={`flex min-h-0 flex-1 flex-col gap-3 ${DESKTOP_PANEL_MIN_HEIGHT_CLASS}`}
        >
          <Tabs defaultValue="visual" className={`flex w-full flex-col lg:flex-1 ${DESKTOP_PANEL_MIN_HEIGHT_CLASS}`}>
            <Card className={`flex w-full flex-col border-border/70 bg-card/80 shadow-none lg:flex-1 ${DESKTOP_PANEL_MIN_HEIGHT_CLASS}`}>
              <CardContent className={`relative px-4 pb-4 pt-4 lg:flex-1 lg:overflow-hidden ${DESKTOP_PANEL_CONTENT_MIN_HEIGHT_CLASS}`}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm font-medium">预览</span>
                  </div>
                  <TabsList className="h-8 shrink-0">
                    <TabsTrigger value="yaml" className="text-xs px-3 h-6">
                      YAML
                    </TabsTrigger>
                    <TabsTrigger value="visual" className="text-xs px-3 h-6">
                      可视化
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="yaml" className="mt-0 data-[state=inactive]:hidden lg:absolute lg:inset-x-4 lg:bottom-4 lg:top-[3.25rem]">
                  <div className="h-[clamp(420px,70vh,820px)] overflow-auto rounded-xl border border-white/10 bg-white/5 lg:h-full custom-scrollbar">
                    {generatedYamlError ? (
                      <div className="h-full p-5 text-sm text-rose-200">
                        <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
                          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-300" />
                          <div>
                            <div className="font-medium text-rose-100">基础和 DNS 配置有错误</div>
                            <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-rose-100/90">
                              {generatedYamlError}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ) : generatedYaml ? (
                      <YamlHighlight content={generatedYaml} className="h-full" />
                    ) : (
                      <pre className="p-5 font-mono text-xs text-white/60 whitespace-pre">
                        {`# 请先添加订阅或节点
# 配置将在此处预览

# 示例配置结构:
# proxies:
#   - name: "节点名称"
#     type: vmess
#     ...
#
# proxy-groups:
#   - name: "🚀 节点选择"
#     type: select
#     ...
#
# rules:
#   - RULE-SET,xxx,代理组
#   ...`}
                      </pre>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="visual" className="mt-0 data-[state=inactive]:hidden lg:absolute lg:inset-x-4 lg:bottom-4 lg:top-[3.25rem]">
                  <div className="h-[clamp(420px,70vh,820px)] overflow-hidden rounded-xl border border-white/10 bg-white/5 lg:h-full">
                    <VisualGraph />
                  </div>
                </TabsContent>
              </CardContent>
              <CardFooter className="flex-shrink-0 flex-row flex-wrap justify-center gap-2 border-t border-border/60 px-4 pb-4 pt-3">
                <Button
                  className="h-10"
                  disabled={!generatedYaml || Boolean(generatedYamlError)}
                  onClick={() => handleDownload(lastGeneratedMode)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  下载配置
                </Button>
                <Button
                  className="h-10"
                  variant="outline"
                  disabled={!generatedYaml || Boolean(generatedYamlError) || !authChecked}
                  onClick={() => subscription.handleGenerateSubscription(lastGeneratedMode)}
                >
                  保存订阅
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
                {subscription.isEditingExistingSubscription && (
                  <Button
                    className="h-10 border-rose-500/50 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-400/70"
                    variant="outline"
                    onClick={() => (window.location.href = "/clash")}
                    title="退出编辑模式"
                  >
                    退出编辑
                  </Button>
                )}
              </CardFooter>
            </Card>
          </Tabs>
        </div>

        {/* Right Column - Configuration */}
        <div
          id="config"
          className={`flex min-h-0 flex-col gap-3 lg:w-[32rem] lg:shrink-0 xl:w-[34rem] ${DESKTOP_PANEL_MIN_HEIGHT_CLASS}`}
        >
          <Card className={`flex w-full flex-col overflow-visible border-border/70 bg-card/80 shadow-none lg:flex-1 lg:overflow-hidden ${DESKTOP_PANEL_MIN_HEIGHT_CLASS}`}>
            <CardContent className={`relative px-4 pb-4 pt-4 lg:flex-1 lg:overflow-y-auto custom-scrollbar ${DESKTOP_PANEL_CONTENT_MIN_HEIGHT_CLASS}`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
                    <Settings2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="shrink-0">配置</span>
                  </div>
                  <p className="mt-1 text-xs text-white/45">快捷模式</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 shrink-0 gap-2"
                  onClick={openAdvancedDialog}
                >
                  <Settings2 className="h-4 w-4" />
                  高级模式
                </Button>
              </div>
              <QuickMode />
            </CardContent>
            <CardFooter className="flex-shrink-0 flex-row flex-wrap justify-center gap-2 border-t border-border/60 px-4 pb-4 pt-3">
              <Button className="h-10" onClick={() => runGenerate("quick")} disabled={configLoading || !hasValidSources}>
                {configLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    生成配置
                  </>
                )}
              </Button>
              {user && templateUploadHref && (
                <Link href={templateUploadHref}>
                  <Button
                    variant="outline"
                    className="h-10 gap-2"
                    onClick={() => {
                      onTemplateUploadOpen?.();
                      interactions.templateUploadOpened?.({ entry: "home" });
                    }}
                  >
                    <Upload className="h-4 w-4" />
                    另存模板
                  </Button>
                </Link>
              )}
            </CardFooter>
          </Card>
        </div>
        </div>
      </div>

      {/* 未保存提醒 */}
      <UnsavedPrompt />

      {saveRequirementSlot}

      <Dialog open={advancedDialogOpen} onOpenChange={setAdvancedDialogOpen}>
        <DialogContent className="max-h-[88vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-white/10 px-5 py-4">
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-indigo-400" />
              高级模式
            </DialogTitle>
            <DialogDescription>
              调整完整配置项后生成 Clash 配置
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(88vh-9.5rem)] overflow-y-auto px-5 py-4 custom-scrollbar">
            <AdvancedMode />
          </div>
          <DialogFooter className="border-t border-white/10 px-5 py-4">
            <Button variant="outline" onClick={() => setAdvancedDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                runGenerate("advanced");
                setAdvancedDialogOpen(false);
              }}
              disabled={configLoading || !hasValidSources}
            >
              {configLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  生成配置
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 订阅链接对话框 */}
      <SubscriptionLinkDialog
        open={subscription.subscriptionDialog}
        onOpenChange={subscription.setSubscriptionDialog}
        subscriptionUrl={subscription.subscriptionUrl}
        subscriptionName={subscription.subscriptionName}
        setSubscriptionName={subscription.setSubscriptionName}
        smartNodeMatchingEnabled={subscription.smartNodeMatchingEnabled}
        setSmartNodeMatchingEnabled={subscription.setSmartNodeMatchingEnabled}
        isCreatingSubscription={subscription.isCreatingSubscription}
        copied={subscription.copied}
        isEditingExistingSubscription={subscription.isEditingExistingSubscription}
        handleCopyUrl={subscription.handleCopyUrl}
        handleCreateSubscription={subscription.handleCreateSubscription}
      />
    </div>
  );
}

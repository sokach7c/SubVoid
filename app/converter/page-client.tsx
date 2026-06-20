"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Copy01Icon,
  Delete01Icon,
  Link03Icon,
  Settings02Icon,
  Tick02Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { getAuthHeaders } from "@/lib/auth-storage";
import { CLIENT_TYPES } from "@/lib/subconverter/client-types";
import {
  createDefaultConverterForm,
  makeSubscriptionUrl,
} from "@/lib/subconverter/converter";
import type {
  ConverterForm,
  CustomConverterParam,
  RemoteConfig,
} from "@/lib/subconverter/types";
import { validateSubUrl } from "@/lib/subconverter/validators";

interface RemoteConfigResponse {
  remoteConfigs?: RemoteConfig[];
}

interface HealthResponse {
  status?: "healthy" | "down" | "unknown";
  version?: string;
  message?: string;
  latencyMs?: number;
}

const DEFAULT_BACKEND =
  process.env.NEXT_PUBLIC_SUBCONVERTER_DEFAULT_BACKEND ||
  "http://127.0.0.1:25500/sub?";

export function ConverterPageClient() {
  const [form, setForm] = useState<ConverterForm>(() =>
    createDefaultConverterForm()
  );
  const [advanced, setAdvanced] = useState(true);
  const [needUdp, setNeedUdp] = useState(false);
  const [customParams, setCustomParams] = useState<CustomConverterParam[]>([]);
  const [remoteConfigs, setRemoteConfigs] = useState<RemoteConfig[]>([]);
  const [resultUrl, setResultUrl] = useState("");
  const [message, setMessage] = useState("");
  const [health, setHealth] = useState<HealthResponse>({ status: "unknown" });
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const groupedRemoteConfigs = useMemo(() => {
    return remoteConfigs.reduce<Record<string, RemoteConfig[]>>((groups, item) => {
      groups[item.groupName] = [...(groups[item.groupName] ?? []), item];
      return groups;
    }, {});
  }, [remoteConfigs]);

  useEffect(() => {
    async function loadRemoteConfigs() {
      const response = await fetch("/api/remote-configs?enabledOnly=true", {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as RemoteConfigResponse;
      setRemoteConfigs(payload.remoteConfigs ?? []);
    }

    void loadRemoteConfigs();
  }, []);

  function updateForm<K extends keyof ConverterForm>(
    key: K,
    value: ConverterForm[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateTemplate(
    section: "surge" | "clash",
    key: "doh",
    value: boolean
  ) {
    setForm((current) => ({
      ...current,
      tpl: {
        ...current.tpl,
        [section]: {
          ...current.tpl[section],
          [key]: value,
        },
      },
    }));
  }

  async function handleGenerate() {
    const validation = validateSubUrl(form.sourceSubUrl);
    if (!validation.valid) {
      setMessage(validation.message ?? "订阅链接无效");
      return;
    }

    const nextUrl = makeSubscriptionUrl({
      form,
      advanced,
      backend: DEFAULT_BACKEND,
      customParams,
      needUdp,
    });

    if (!nextUrl) {
      setMessage("订阅链接与客户端为必填项");
      return;
    }

    setResultUrl(nextUrl);
    setMessage("订阅链接已生成");

    await navigator.clipboard.writeText(nextUrl).catch(() => undefined);
  }

  async function handleCopy() {
    if (!resultUrl) {
      return;
    }

    await navigator.clipboard.writeText(resultUrl);
    setMessage("已复制");
  }

  function handleClashInstall() {
    if (!resultUrl) {
      setMessage("请先生成订阅链接");
      return;
    }

    window.open(`clash://install-config?url=${encodeURIComponent(resultUrl)}`);
  }

  const checkBackendHealth = useCallback(async () => {
    setIsCheckingHealth(true);

    try {
      const response = await fetch(
        `/api/subconverter/health?backend=${encodeURIComponent(DEFAULT_BACKEND)}`,
        { headers: getAuthHeaders() }
      );
      const payload = (await response.json().catch(() => ({}))) as HealthResponse;

      setHealth({
        status: response.ok ? "healthy" : "down",
        version: payload.version,
        message: payload.message,
        latencyMs: payload.latencyMs,
      });
    } catch (error) {
      setHealth({
        status: "down",
        message: error instanceof Error ? error.message : "健康检查失败",
      });
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void checkBackendHealth();
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [checkBackendHealth]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="border-b border-border px-4 md:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-semibold truncate">
              订阅转换
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              基于本地表单生成 subconverter 长链接。
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <BackendHealthBadge
              health={health}
              isChecking={isCheckingHealth}
              onRefresh={checkBackendHealth}
            />
            <Button variant="outline" size="sm" onClick={handleClashInstall}>
              <HugeiconsIcon icon={Link03Icon} className="size-4" />
              导入 Clash
            </Button>
            <Button size="sm" onClick={handleGenerate}>
              生成
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <section className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="sourceSubUrl">订阅链接</Label>
              <Textarea
                id="sourceSubUrl"
                rows={9}
                className="min-h-48"
                value={form.sourceSubUrl}
                onChange={(event) =>
                  updateForm("sourceSubUrl", event.target.value)
                }
                placeholder="支持订阅或 ss/ssr/vmess 链接，多个链接每行一个或用 | 分隔"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>客户端</Label>
                <Select
                  value={form.clientType}
                  onValueChange={(value) => {
                    if (value) {
                      updateForm("clientType", value);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择客户端" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {Object.entries(CLIENT_TYPES).map(([label, value]) => (
                        <SelectItem key={label} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>模式</Label>
                <div className="flex h-9 rounded-md border border-border p-1">
                  <Button
                    type="button"
                    variant={advanced ? "ghost" : "secondary"}
                    size="sm"
                    className="flex-1 h-7"
                    onClick={() => setAdvanced(false)}
                  >
                    基础
                  </Button>
                  <Button
                    type="button"
                    variant={advanced ? "secondary" : "ghost"}
                    size="sm"
                    className="flex-1 h-7"
                    onClick={() => setAdvanced(true)}
                  >
                    进阶
                  </Button>
                </div>
              </div>
            </div>

            {advanced && (
              <>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2 md:col-span-2">
                    <Label>远程配置</Label>
                    <Select
                      value={form.remoteConfig}
                      onValueChange={(value) =>
                        updateForm("remoteConfig", value ?? "")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="请选择远程配置" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(groupedRemoteConfigs).map(
                          ([groupName, configs]) => (
                            <SelectGroup key={groupName}>
                              <SelectLabel>{groupName}</SelectLabel>
                              {configs.map((config) => (
                                <SelectItem key={config.id} value={config.url}>
                                  {config.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <TextField
                    id="includeRemarks"
                    label="Include"
                    value={form.includeRemarks}
                    placeholder="节点名包含的关键字，支持正则"
                    onChange={(value) => updateForm("includeRemarks", value)}
                  />
                  <TextField
                    id="excludeRemarks"
                    label="Exclude"
                    value={form.excludeRemarks}
                    placeholder="节点名不包含的关键字，支持正则"
                    onChange={(value) => updateForm("excludeRemarks", value)}
                  />
                <TextField
                  id="filename"
                  label="文件名"
                  value={form.filename}
                  placeholder="返回的订阅文件名"
                    onChange={(value) => updateForm("filename", value)}
                  />
                </div>
              </>
            )}
          </section>

          <section className="space-y-4">
            <div className="rounded-md border border-border p-3">
              <div className="mb-3 flex items-center gap-2">
                <HugeiconsIcon
                  icon={Settings02Icon}
                  className="size-4 text-muted-foreground"
                />
                <h2 className="text-sm font-semibold">转换选项</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <CheckField
                  label="输出为 Node List"
                  checked={form.nodeList}
                  onChange={(value) => updateForm("nodeList", value)}
                />
                <CheckField
                  label="Emoji"
                  checked={form.emoji}
                  onChange={(value) => updateForm("emoji", value)}
                />
                <CheckField
                  label="跳过证书验证"
                  checked={form.scv}
                  onChange={(value) => updateForm("scv", value)}
                />
                <CheckField
                  label="启用 UDP"
                  checked={form.udp}
                  onChange={(value) => {
                    updateForm("udp", value);
                    setNeedUdp(true);
                  }}
                />
                <CheckField
                  label="节点类型"
                  checked={form.appendType}
                  onChange={(value) => updateForm("appendType", value)}
                />
                <CheckField
                  label="排序节点"
                  checked={form.sort}
                  onChange={(value) => updateForm("sort", value)}
                />
                <CheckField
                  label="过滤非法节点"
                  checked={form.fdn}
                  onChange={(value) => updateForm("fdn", value)}
                />
                <CheckField
                  label="规则展开"
                  checked={form.expand}
                  onChange={(value) => updateForm("expand", value)}
                />
                <CheckField
                  label="Surge.DoH"
                  checked={form.tpl.surge.doh}
                  onChange={(value) => updateTemplate("surge", "doh", value)}
                />
                <CheckField
                  label="Clash.DoH"
                  checked={form.tpl.clash.doh}
                  onChange={(value) => updateTemplate("clash", "doh", value)}
                />
                <CheckField
                  label="网易云"
                  checked={form.insert}
                  onChange={(value) => updateForm("insert", value)}
                />
                <CheckField
                  label="Clash 新字段"
                  checked={form.newName}
                  onChange={(value) => updateForm("newName", value)}
                />
              </div>
            </div>

            <div className="rounded-md border border-border p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">自定义参数</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCustomParams((current) => [
                      ...current,
                      { name: "", value: "" },
                    ])
                  }
                >
                  <HugeiconsIcon icon={Add01Icon} className="size-4" />
                  添加
                </Button>
              </div>
              <div className="space-y-2">
                {customParams.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    暂无自定义参数。
                  </p>
                )}
                {customParams.map((param, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <Input
                      value={param.name}
                      placeholder="参数名"
                      onChange={(event) =>
                        setCustomParams((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, name: event.target.value }
                              : item
                          )
                        )
                      }
                    />
                    <Input
                      value={param.value}
                      placeholder="参数值"
                      onChange={(event) =>
                        setCustomParams((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, value: event.target.value }
                              : item
                          )
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setCustomParams((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index)
                        )
                      }
                    >
                      <HugeiconsIcon icon={Delete01Icon} className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-md border border-border p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Label htmlFor="resultUrl">定制订阅</Label>
            <Button
              variant="outline"
              size="sm"
              disabled={!resultUrl}
              onClick={handleCopy}
            >
              <HugeiconsIcon icon={Copy01Icon} className="size-4" />
              复制
            </Button>
          </div>
          <Textarea
            id="resultUrl"
            rows={3}
            value={resultUrl}
            readOnly
            placeholder="生成后的订阅链接会显示在这里"
          />
          {message && (
            <p className="mt-2 text-xs text-muted-foreground">{message}</p>
          )}
        </section>
      </div>
    </div>
  );
}

function BackendHealthBadge(props: {
  health: HealthResponse;
  isChecking: boolean;
  onRefresh: () => void;
}) {
  const isHealthy = props.health.status === "healthy";
  const label = props.isChecking
    ? "检查中"
    : isHealthy
      ? `正常：${props.health.version || "未知版本"} ${
          typeof props.health.latencyMs === "number"
            ? `${props.health.latencyMs}ms`
            : ""
        }`
      : props.health.status === "down"
        ? "后端异常"
        : "未检查";
  const detail = props.health.version
    ? props.health.version
    : props.health.message;

  return (
    <button
      type="button"
      onClick={props.onRefresh}
      className="min-w-0"
      title={detail}
    >
      <Badge
        variant={isHealthy ? "secondary" : "outline"}
        className="max-w-72 gap-1"
      >
        <HugeiconsIcon
          icon={isHealthy ? Tick02Icon : AlertCircleIcon}
          className={
            isHealthy ? "text-green-500 size-3" : "text-orange-500 size-3"
          }
        />
        <span className="truncate">{label}</span>
      </Badge>
    </button>
  );
}

function TextField(props: {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input
        id={props.id}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}

function CheckField(props: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-w-0 items-center gap-2">
      <Checkbox checked={props.checked} onCheckedChange={props.onChange} />
      <span className="truncate text-xs">{props.label}</span>
    </label>
  );
}

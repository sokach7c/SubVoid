"use client";

import { useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete01Icon,
  PencilEdit01Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuthHeaders } from "@/lib/auth-storage";
import type { RemoteConfig, RemoteConfigInput } from "@/lib/subconverter/types";

interface RemoteConfigResponse {
  remoteConfigs?: RemoteConfig[];
}

interface RemoteConfigMutationResponse {
  remoteConfig?: RemoteConfig;
  message?: string;
}

const EMPTY_FORM: RemoteConfigInput = {
  groupName: "",
  label: "",
  url: "",
  enabled: true,
  sortOrder: 0,
};

export function RemoteConfigsPageClient() {
  const [remoteConfigs, setRemoteConfigs] = useState<RemoteConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<RemoteConfig | null>(null);
  const [form, setForm] = useState<RemoteConfigInput>(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const groupedCounts = useMemo(() => {
    return remoteConfigs.reduce<Record<string, number>>((counts, config) => {
      counts[config.groupName] = (counts[config.groupName] ?? 0) + 1;
      return counts;
    }, {});
  }, [remoteConfigs]);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected =
    remoteConfigs.length > 0 && selectedIds.length === remoteConfigs.length;
  const partiallySelected =
    selectedIds.length > 0 && selectedIds.length < remoteConfigs.length;

  useEffect(() => {
    async function loadRemoteConfigs() {
      setIsLoading(true);
      const response = await fetch("/api/remote-configs", {
        headers: getAuthHeaders(),
      });

      setIsLoading(false);

      if (!response.ok) {
        setMessage("远程配置加载失败");
        return;
      }

      const payload = (await response.json()) as RemoteConfigResponse;
      setRemoteConfigs(payload.remoteConfigs ?? []);
    }

    void loadRemoteConfigs();
  }, []);

  function openCreateDialog() {
    setEditingConfig(null);
    setForm(EMPTY_FORM);
    setMessage("");
    setDialogOpen(true);
  }

  function openEditDialog(config: RemoteConfig) {
    setEditingConfig(config);
    setForm({
      groupName: config.groupName,
      label: config.label,
      url: config.url,
      enabled: config.enabled,
      sortOrder: config.sortOrder,
    });
    setMessage("");
    setDialogOpen(true);
  }

  async function saveRemoteConfig() {
    const endpoint = editingConfig
      ? `/api/remote-configs/${editingConfig.id}`
      : "/api/remote-configs";
    const method = editingConfig ? "PUT" : "POST";
    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(form),
    });
    const payload = (await response.json().catch(() => ({}))) as
      | RemoteConfigMutationResponse
      | Record<string, never>;

    if (!response.ok || !("remoteConfig" in payload) || !payload.remoteConfig) {
      setMessage(
        "message" in payload && typeof payload.message === "string"
          ? payload.message
          : "远程配置保存失败"
      );
      return;
    }

    const savedRemoteConfig = payload.remoteConfig;

    setRemoteConfigs((current) => {
      if (editingConfig) {
        return current.map((item) =>
          item.id === savedRemoteConfig.id ? savedRemoteConfig : item
        );
      }

      return [...current, savedRemoteConfig].sort(compareRemoteConfigs);
    });
    setDialogOpen(false);
  }

  async function deleteConfig(config: RemoteConfig) {
    const response = await fetch(`/api/remote-configs/${config.id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      setMessage("远程配置删除失败");
      return;
    }

    setRemoteConfigs((current) =>
      current.filter((item) => item.id !== config.id)
    );
    setSelectedIds((current) => current.filter((id) => id !== config.id));
  }

  async function deleteSelectedConfigs() {
    if (selectedIds.length === 0) {
      return;
    }

    const idsToDelete = [...selectedIds];
    const results = await Promise.all(
      idsToDelete.map((id) =>
        fetch(`/api/remote-configs/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        })
      )
    );
    const deletedIds = idsToDelete.filter((_, index) => results[index].ok);

    if (deletedIds.length !== idsToDelete.length) {
      setMessage("部分远程配置删除失败");
    } else {
      setMessage(`已删除 ${deletedIds.length} 条远程配置`);
    }

    setRemoteConfigs((current) =>
      current.filter((item) => !deletedIds.includes(item.id))
    );
    setSelectedIds((current) =>
      current.filter((id) => !deletedIds.includes(id))
    );
  }

  async function toggleEnabled(config: RemoteConfig, enabled: boolean) {
    const response = await fetch(`/api/remote-configs/${config.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        groupName: config.groupName,
        label: config.label,
        url: config.url,
        enabled,
        sortOrder: config.sortOrder,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as
      | RemoteConfigMutationResponse
      | Record<string, never>;

    if (!response.ok || !("remoteConfig" in payload) || !payload.remoteConfig) {
      setMessage("远程配置状态更新失败");
      return;
    }

    const updatedRemoteConfig = payload.remoteConfig;

    setRemoteConfigs((current) =>
      current.map((item) =>
        item.id === updatedRemoteConfig.id ? updatedRemoteConfig : item
      )
    );
  }

  function updateForm<K extends keyof RemoteConfigInput>(
    key: K,
    value: RemoteConfigInput[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleSelected(id: string, selected: boolean) {
    setSelectedIds((current) => {
      if (selected) {
        return current.includes(id) ? current : [...current, id];
      }

      return current.filter((item) => item !== id);
    });
  }

  function toggleAllSelected(selected: boolean) {
    setSelectedIds(selected ? remoteConfigs.map((config) => config.id) : []);
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="border-b border-border px-4 md:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-semibold truncate">
              远程配置
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              管理订阅转换使用的远程配置预设。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={deleteSelectedConfigs}
              disabled={selectedIds.length === 0}
            >
              <HugeiconsIcon icon={Delete01Icon} className="size-4" />
              删除选中
              {selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
            </Button>
            <Button size="sm" onClick={openCreateDialog}>
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
              新增
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {Object.entries(groupedCounts).map(([group, count]) => (
            <Badge key={group} variant="outline">
              {group}: {count}
            </Badge>
          ))}
        </div>

        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    aria-checked={partiallySelected ? "mixed" : allSelected}
                    onCheckedChange={(value) => toggleAllSelected(Boolean(value))}
                    aria-label="选择全部远程配置"
                  />
                </TableHead>
                <TableHead>分组</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="w-24">启用</TableHead>
                <TableHead className="w-24">排序</TableHead>
                <TableHead className="w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    正在加载远程配置...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && remoteConfigs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    暂无远程配置。
                  </TableCell>
                </TableRow>
              )}
              {remoteConfigs.map((config) => (
                <TableRow key={config.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIdSet.has(config.id)}
                      onCheckedChange={(value) =>
                        toggleSelected(config.id, Boolean(value))
                      }
                      aria-label={`选择 ${config.label}`}
                    />
                  </TableCell>
                  <TableCell>{config.groupName}</TableCell>
                  <TableCell className="font-medium">{config.label}</TableCell>
                  <TableCell className="max-w-[520px] truncate text-muted-foreground">
                    {config.url}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(value) =>
                        toggleEnabled(config, Boolean(value))
                      }
                      aria-label={`${config.enabled ? "停用" : "启用"} ${
                        config.label
                      }`}
                    />
                  </TableCell>
                  <TableCell>{config.sortOrder}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditDialog(config)}
                        aria-label="编辑远程配置"
                      >
                        <HugeiconsIcon
                          icon={PencilEdit01Icon}
                          className="size-4"
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteConfig(config)}
                        aria-label="删除远程配置"
                      >
                        <HugeiconsIcon icon={Delete01Icon} className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {message && (
          <p className="mt-3 text-xs text-muted-foreground">{message}</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon
                icon={Settings02Icon}
                className="size-4 text-muted-foreground"
              />
              {editingConfig ? "编辑远程配置" : "新增远程配置"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <TextField
              id="groupName"
              label="分组"
              value={form.groupName}
              onChange={(value) => updateForm("groupName", value)}
            />
            <TextField
              id="label"
              label="名称"
              value={form.label}
              onChange={(value) => updateForm("label", value)}
            />
            <TextField
              id="url"
              label="URL"
              value={form.url}
              onChange={(value) => updateForm("url", value)}
            />
            <TextField
              id="sortOrder"
              label="排序"
              value={form.sortOrder.toString()}
              type="number"
              onChange={(value) => updateForm("sortOrder", Number(value) || 0)}
            />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.enabled}
                onCheckedChange={(value) => updateForm("enabled", Boolean(value))}
              />
              启用
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={saveRemoteConfig}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TextField(props: {
  id: string;
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input
        id={props.id}
        type={props.type}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}

function compareRemoteConfigs(a: RemoteConfig, b: RemoteConfig): number {
  return (
    a.groupName.localeCompare(b.groupName) ||
    a.sortOrder - b.sortOrder ||
    a.label.localeCompare(b.label)
  );
}

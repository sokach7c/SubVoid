// @ts-nocheck
"use client";

import { Button } from "@subboost/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@subboost/ui/components/ui/dialog";
import { Input } from "@subboost/ui/components/ui/input";
import { Label } from "@subboost/ui/components/ui/label";
import { Switch } from "@subboost/ui/components/ui/switch";
import { SmartNodeMatchingHelp } from "@subboost/ui/components/subscription/smart-node-matching-help";
import type { Subscription } from "./dashboard-types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
  settingsName: string;
  setSettingsName: (value: string) => void;
  smartNodeMatchingEnabled: boolean;
  setSmartNodeMatchingEnabled: (value: boolean) => void;
  savingSettings: boolean;
  onSave: () => void;
};

export function SubscriptionSettingsDialog({
  open,
  onOpenChange,
  settingsName,
  setSettingsName,
  smartNodeMatchingEnabled,
  setSmartNodeMatchingEnabled,
  savingSettings,
  onSave,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>订阅设置</DialogTitle>
          <DialogDescription>修改订阅名称与更新时的节点匹配策略</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>订阅名称</Label>
            <Input
              value={settingsName}
              onChange={(e) => setSettingsName(e.target.value)}
              maxLength={100}
              placeholder="例如：我的配置"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm text-white/70">更新时智能匹配节点</p>
                <SmartNodeMatchingHelp enabled={smartNodeMatchingEnabled} />
              </div>
            </div>
            <Switch checked={smartNodeMatchingEnabled} onCheckedChange={setSmartNodeMatchingEnabled} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={savingSettings}>
            取消
          </Button>
          <Button onClick={onSave} disabled={savingSettings}>
            {savingSettings ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

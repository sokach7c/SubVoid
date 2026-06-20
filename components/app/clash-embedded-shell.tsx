"use client";

import * as React from "react";
import { ConfirmDialogHost } from "@/features/clash/ui/components/ui/confirm-dialog";
import { Toaster } from "@/features/clash/ui/components/ui/toaster";

interface ClashEmbeddedShellProps {
  children: React.ReactNode;
}

export function ClashEmbeddedShell({ children }: ClashEmbeddedShellProps) {
  return (
    <div className="dark flex h-full min-h-0 w-full flex-col overflow-hidden bg-black text-white">
      <div className="min-h-0 flex-1 overflow-auto bg-background">
        {children}
      </div>
      <Toaster />
      <ConfirmDialogHost />
    </div>
  );
}

// @ts-nocheck
"use client";

import * as React from "react";

type ConfirmDialogOptions = {
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
};

export async function confirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  const message = [options.title, typeof options.description === "string" ? options.description : ""]
    .filter(Boolean)
    .join("\n");
  return window.confirm(message);
}

export function ConfirmDialogHost() {
  return null;
}

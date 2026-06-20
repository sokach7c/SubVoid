// @ts-nocheck
"use client";

import * as React from "react";

type ToastVariant = "default" | "info" | "success" | "warning" | "destructive";

export type ToastProps = {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export type ToastActionElement = React.ReactElement;

type ToastRecord = ToastProps & { id: string };

const listeners = new Set<(toasts: ToastRecord[]) => void>();
let toasts: ToastRecord[] = [];
let count = 0;

function emit() {
  listeners.forEach((listener) => listener(toasts));
}

export function toast(props: Omit<ToastRecord, "id">) {
  const id = String((count += 1));
  toasts = [{ ...props, id }, ...toasts].slice(0, 5);
  emit();
  const dismiss = () => {
    toasts = toasts.filter((item) => item.id !== id);
    emit();
  };
  window.setTimeout(dismiss, 4500);
  return { id, dismiss, update: () => undefined };
}

export function useToast() {
  const [state, setState] = React.useState(toasts);

  React.useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return {
    toasts: state,
    toast,
    dismiss: (toastId?: string) => {
      toasts = toastId ? toasts.filter((item) => item.id !== toastId) : [];
      emit();
    },
  };
}

function variantClassName(variant: ToastVariant | undefined): string {
  if (variant === "destructive") return "border-red-500/40 text-red-100";
  if (variant === "warning") return "border-amber-500/40 text-amber-100";
  if (variant === "success") return "border-emerald-500/40 text-emerald-100";
  if (variant === "info") return "border-sky-500/40 text-sky-100";
  return "border-white/10 text-white";
}

export function Toaster() {
  const { toasts: items, dismiss } = useToast();

  return (
    <div className="fixed right-4 top-20 z-[100] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={`rounded-xl border bg-black/90 p-4 shadow-2xl backdrop-blur ${variantClassName(item.variant)}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {item.title ? <div className="text-sm font-semibold">{item.title}</div> : null}
              {item.description ? (
                <div className="mt-1 text-sm text-white/65">{item.description}</div>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded-md px-1.5 py-0.5 text-xs text-white/50 hover:bg-white/10 hover:text-white"
              onClick={() => dismiss(item.id)}
            >
              关闭
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ToastAction(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} />;
}

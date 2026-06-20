// @ts-nocheck
import * as React from "react";
import {
  Popover as Root,
  PopoverTrigger,
  PopoverContent as Content,
} from "@/components/ui/popover";

function Trigger({ asChild, children, ...props }) {
  if (asChild && React.isValidElement(children)) {
    return <PopoverTrigger render={children} {...props} />;
  }

  return <PopoverTrigger {...props}>{children}</PopoverTrigger>;
}

export { Root, Trigger, Content };

export function Portal({ children }: { children: React.ReactNode }) {
  return children;
}

export function Arrow({ className }: { className?: string }) {
  return <div className={className} />;
}

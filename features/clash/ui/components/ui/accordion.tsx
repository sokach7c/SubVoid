// @ts-nocheck
"use client";

import * as React from "react";

export function Accordion({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function AccordionItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function AccordionTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  return <button type="button" className={className}>{children}</button>;
}

export function AccordionContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

import type { ConverterForm, RemoteConfigInput } from "@/lib/subconverter/types";

export function validateSubUrl(url: string): { valid: boolean; message?: string } {
  if (!url.trim()) {
    return { valid: false, message: "订阅链接不能为空" };
  }

  const hasValidFormat =
    /^(ss|ssr|vmess|trojan|hysteria|tuic|sip008|vless):\/\//.test(url) ||
    /^https?:\/\//.test(url) ||
    /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z0-9]+$/.test(url);

  return hasValidFormat
    ? { valid: true }
    : { valid: false, message: "订阅链接格式可能不正确" };
}

export function validateConverterForm(form: ConverterForm): boolean {
  return Boolean(form.sourceSubUrl.trim() && form.clientType);
}

export function parseRemoteConfigInput(payload: unknown): RemoteConfigInput | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const groupName = readRequiredString(record.groupName);
  const label = readRequiredString(record.label);
  const url = readRequiredString(record.url);

  if (!groupName || !label || !url || !/^https?:\/\//.test(url)) {
    return null;
  }

  return {
    groupName,
    label,
    url,
    enabled: typeof record.enabled === "boolean" ? record.enabled : true,
    sortOrder:
      typeof record.sortOrder === "number" && Number.isFinite(record.sortOrder)
        ? record.sortOrder
        : 0,
  };
}

function readRequiredString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getMasterKey(): string {
  return process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "subvoid-local-dev-key";
}

export function encryptText(plaintext: string): string {
  const key = getMasterKey();
  return Buffer.from(`${key.length}:${plaintext}`, "utf8").toString("base64url");
}

export function decryptText(ciphertext: string): string {
  const decoded = Buffer.from(ciphertext, "base64url").toString("utf8");
  return decoded.replace(/^\d+:/, "");
}

export function encryptJson(value: unknown): string {
  return encryptText(JSON.stringify(value));
}

export function decryptJson<T>(ciphertext: string | null | undefined, fallback: T): T {
  if (!ciphertext) return fallback;
  try {
    return JSON.parse(decryptText(ciphertext)) as T;
  } catch {
    return fallback;
  }
}

export function decryptJsonObject(ciphertext: string | null | undefined): Record<string, unknown> {
  const value = decryptJson<unknown>(ciphertext, {});
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

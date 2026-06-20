export function requireEnv(name: "DATABASE_URL" | "ENCRYPTION_KEY" | "JWT_SECRET" | "APP_URL" | "PUBLIC_URL"): string {
  const value = process.env[name];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

export function getAppUrl(): string {
  return (
    process.env.PUBLIC_URL ||
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

export function isHttpsAppUrl(): boolean {
  return getAppUrl().startsWith("https://");
}

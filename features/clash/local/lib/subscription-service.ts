import { randomUUID } from "node:crypto";
import { generateClashYaml } from "@subboost/core/generator";
import { buildGenerateOptionsFromConfig, getEffectiveTestOptions } from "@subboost/core/subscription/config-utils";
import { buildProxyProvidersFromConfig } from "@subboost/core/subscription/proxy-providers";
import type { SubscriptionResponseInfo } from "@subboost/core/subscription/subscription-response-info";
import type { ParsedNode } from "@subboost/core/types/node";
import {
  buildManualRefreshFailureResponse,
  buildManualRefreshSuccessResponseBody,
  normalizeSubscriptionConfigForPersistence,
  normalizeSubscriptionInfoForPersistence,
  normalizeSubscriptionName,
  normalizeSubscriptionNodeList,
  normalizeSubscriptionUrlList,
  prepareRefreshCacheResult,
  refreshNodeSnapshot,
  serializeSubscriptionDetailData,
  serializeSubscriptionSummaryData,
  type SavedSource,
} from "@subboost/server-core/subscription";
import { getDatabase } from "@/lib/database";
import { decryptJson, decryptJsonObject, encryptJson } from "./crypto";
import { getAppUrl } from "./env";
import { fetchSourceUserInfoHeadersDirect, importSourceUrlDirect } from "./source-import";

export const MAX_NODES_PER_SUBSCRIPTION = 10000;
export const CACHE_TTL_SECONDS = 3600;

export type SubscriptionRow = {
  id: string;
  ownerId: string;
  name: string;
  token: string;
  isPrimary: boolean;
  encryptedUrls: string;
  encryptedNodes: string;
  encryptedConfig: string;
  encryptedSubscriptionInfo: string | null;
  autoUpdateInterval: number | null;
  cacheExpiresAt: string | null;
  lastAccessedAt: string | null;
  lastUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  autoUpdateState?: null;
};

type SubscriptionDbRow = {
  id: string;
  owner_id: string;
  name: string;
  token: string;
  is_primary: 0 | 1;
  encrypted_urls: string;
  encrypted_nodes: string;
  encrypted_config: string;
  encrypted_subscription_info: string | null;
  cache_expires_at: string | null;
  last_accessed_at: string | null;
  last_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionSummary = ReturnType<typeof formatSubscription>;
export type SubscriptionDetail = ReturnType<typeof formatSubscriptionDetail>;

export type GeneratedSubscriptionYaml = {
  yaml: string;
  name: string;
  subscriptionInfo: SubscriptionResponseInfo;
  cacheExpirySeconds: number;
  autoUpdateIntervalSeconds: number | null;
  isAdmin: boolean;
};

function db() {
  const database = getDatabase();
  database.exec(`
    CREATE TABLE IF NOT EXISTS clash_subscriptions (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      is_primary INTEGER NOT NULL DEFAULT 0,
      encrypted_urls TEXT NOT NULL,
      encrypted_nodes TEXT NOT NULL,
      encrypted_config TEXT NOT NULL,
      encrypted_subscription_info TEXT,
      cache_expires_at TEXT,
      last_accessed_at TEXT,
      last_updated_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_clash_subscriptions_owner_updated
    ON clash_subscriptions(owner_id, updated_at);
  `);
  return database;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toRow(row: SubscriptionDbRow): SubscriptionRow {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    token: row.token,
    isPrimary: row.is_primary === 1,
    encryptedUrls: row.encrypted_urls,
    encryptedNodes: row.encrypted_nodes,
    encryptedConfig: row.encrypted_config,
    encryptedSubscriptionInfo: row.encrypted_subscription_info,
    autoUpdateInterval: null,
    cacheExpiresAt: row.cache_expires_at,
    lastAccessedAt: row.last_accessed_at,
    lastUpdatedAt: row.last_updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    autoUpdateState: null,
  };
}

function buildLocalSubscriptionUrl(token: string): string {
  return `${getAppUrl()}/api/clash/subscriptions/${token}/config.yaml`;
}

function buildLocalSubscriptionConfig(
  body: Record<string, unknown>,
  existingConfig: Record<string, unknown> = {}
): Record<string, unknown> {
  return normalizeSubscriptionConfigForPersistence(
    {
      config: body.config,
      smartNodeMatchingEnabled: body.smartNodeMatchingEnabled,
    },
    {
      existingConfig,
      idFactory: randomUUID,
      splitUrlLines: true,
      defaultSmartNodeMatchingEnabled: true,
    }
  );
}

export function readSubscriptionSecrets(row: SubscriptionRow) {
  return {
    urls: decryptJson<string[]>(row.encryptedUrls, []),
    nodes: decryptJson<ParsedNode[]>(row.encryptedNodes, []),
    config: decryptJsonObject(row.encryptedConfig),
    subscriptionInfo:
      normalizeSubscriptionInfoForPersistence(decryptJson<unknown>(row.encryptedSubscriptionInfo, {})) ?? {},
  };
}

export function formatSubscription(row: SubscriptionRow) {
  const secrets = readSubscriptionSecrets(row);
  const subscriptionUrl = buildLocalSubscriptionUrl(row.token);
  return serializeSubscriptionSummaryData(row, secrets, {
    subscriptionUrl,
    yamlUrl: subscriptionUrl,
    dateMode: "iso",
    includeCounts: true,
    includeFailureSourceState: false,
    includeLastAttemptedAt: false,
  });
}

export function formatSubscriptionDetail(row: SubscriptionRow) {
  const secrets = readSubscriptionSecrets(row);
  const subscriptionUrl = buildLocalSubscriptionUrl(row.token);
  return serializeSubscriptionDetailData(row, secrets, {
    subscriptionUrl,
    yamlUrl: subscriptionUrl,
    dateMode: "iso",
    includeCounts: true,
    includeFailureSourceState: false,
    includeLastAttemptedAt: false,
  });
}

export async function listSubscriptions(ownerId: string): Promise<SubscriptionSummary[]> {
  const rows = db()
    .prepare(
      `SELECT * FROM clash_subscriptions
       WHERE owner_id = ?
       ORDER BY updated_at DESC`
    )
    .all(ownerId) as SubscriptionDbRow[];
  return rows.map(toRow).map(formatSubscription);
}

export async function createSubscription(ownerId: string, body: unknown): Promise<SubscriptionSummary> {
  if (!isRecord(body)) throw new Error("Invalid request body.");
  const name = normalizeSubscriptionName(body.name);
  if (!name) throw new Error("Subscription name is required.");

  const urls = normalizeSubscriptionUrlList(body.urls);
  const nodes = normalizeSubscriptionNodeList(body.nodes);
  if (urls.length === 0 && nodes.length === 0) throw new Error("At least one URL or node is required.");

  const config = buildLocalSubscriptionConfig(body);
  const subscriptionInfo = normalizeSubscriptionInfoForPersistence(body.subscriptionInfo) ?? {};
  const now = new Date().toISOString();
  const row: SubscriptionRow = {
    id: randomUUID(),
    ownerId,
    name,
    token: randomUUID(),
    isPrimary: false,
    encryptedUrls: encryptJson(urls),
    encryptedNodes: encryptJson(nodes),
    encryptedConfig: encryptJson(config),
    encryptedSubscriptionInfo: encryptJson(subscriptionInfo),
    autoUpdateInterval: null,
    cacheExpiresAt: null,
    lastAccessedAt: null,
    lastUpdatedAt: now,
    createdAt: now,
    updatedAt: now,
    autoUpdateState: null,
  };

  db()
    .prepare(
      `INSERT INTO clash_subscriptions (
        id, owner_id, name, token, is_primary, encrypted_urls, encrypted_nodes,
        encrypted_config, encrypted_subscription_info, cache_expires_at,
        last_accessed_at, last_updated_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      row.id,
      row.ownerId,
      row.name,
      row.token,
      row.isPrimary ? 1 : 0,
      row.encryptedUrls,
      row.encryptedNodes,
      row.encryptedConfig,
      row.encryptedSubscriptionInfo,
      row.cacheExpiresAt,
      row.lastAccessedAt,
      row.lastUpdatedAt,
      row.createdAt,
      row.updatedAt
    );
  return formatSubscription(row);
}

export async function updateSubscription(ownerId: string, id: string, body: unknown): Promise<SubscriptionSummary | null> {
  if (!isRecord(body)) throw new Error("Invalid request body.");
  const currentDb = db().prepare("SELECT * FROM clash_subscriptions WHERE id = ? AND owner_id = ?").get(id, ownerId) as
    | SubscriptionDbRow
    | undefined;
  if (!currentDb) return null;
  const current = toRow(currentDb);
  const currentSecrets = readSubscriptionSecrets(current);

  const name = normalizeSubscriptionName(body.name) || current.name;
  const hasUrls = "urls" in body;
  const hasNodes = "nodes" in body;
  const hasConfig = "config" in body || "smartNodeMatchingEnabled" in body;
  const urls = hasUrls ? normalizeSubscriptionUrlList(body.urls) : currentSecrets.urls;
  const nodes = hasNodes ? normalizeSubscriptionNodeList(body.nodes) : currentSecrets.nodes;
  if ((hasUrls || hasNodes || hasConfig) && urls.length === 0 && nodes.length === 0) {
    throw new Error("At least one URL or node is required.");
  }

  const config = hasConfig ? buildLocalSubscriptionConfig(body, currentSecrets.config) : currentSecrets.config;
  const subscriptionInfo =
    "subscriptionInfo" in body
      ? normalizeSubscriptionInfoForPersistence(body.subscriptionInfo) ?? {}
      : currentSecrets.subscriptionInfo;
  const now = new Date().toISOString();

  db()
    .prepare(
      `UPDATE clash_subscriptions
       SET name = ?, encrypted_urls = ?, encrypted_nodes = ?, encrypted_config = ?,
           encrypted_subscription_info = ?, updated_at = ?
       WHERE id = ? AND owner_id = ?`
    )
    .run(
      name,
      encryptJson(urls),
      encryptJson(nodes),
      encryptJson(config),
      encryptJson(subscriptionInfo),
      now,
      id,
      ownerId
    );

  const next = db().prepare("SELECT * FROM clash_subscriptions WHERE id = ?").get(id) as SubscriptionDbRow;
  return formatSubscription(toRow(next));
}

export async function getSubscription(ownerId: string, id: string): Promise<SubscriptionDetail | null> {
  const row = db().prepare("SELECT * FROM clash_subscriptions WHERE id = ? AND owner_id = ?").get(id, ownerId) as
    | SubscriptionDbRow
    | undefined;
  return row ? formatSubscriptionDetail(toRow(row)) : null;
}

export async function deleteSubscription(ownerId: string, id: string): Promise<boolean> {
  const result = db().prepare("DELETE FROM clash_subscriptions WHERE id = ? AND owner_id = ?").run(id, ownerId);
  return result.changes > 0;
}

export function buildSubscriptionFetchCallbacks() {
  return {
    fetchUrlNodes: async (source: SavedSource) => {
      const imported = await importSourceUrlDirect({
        url: source.content,
        ...(source.userinfoUrl ? { userinfoUrl: source.userinfoUrl } : {}),
        ...(source.userinfoUserAgent ? { userinfoUserAgent: source.userinfoUserAgent } : {}),
      });
      if (imported.ok) {
        return {
          ok: true,
          nodes: imported.parsedNodes,
          errors: imported.parseErrors,
          headers: imported.headers,
        };
      }
      return {
        ok: false,
        nodes: [],
        responseStatus: imported.responseStatus,
        error: imported.error,
        errorInfo: imported.errorInfo,
        publicReason: imported.publicReason ?? undefined,
      };
    },
    fetchUrlUserInfo: async (source: SavedSource) => fetchSourceUserInfoHeadersDirect(source),
  };
}

export function buildSubscriptionCacheExpiry(from: Date): string {
  return new Date(from.getTime() + CACHE_TTL_SECONDS * 1000).toISOString();
}

export async function refreshSubscription(ownerId: string, id: string) {
  const row = db().prepare("SELECT * FROM clash_subscriptions WHERE id = ? AND owner_id = ?").get(id, ownerId) as
    | SubscriptionDbRow
    | undefined;
  if (!row) return null;

  const current = toRow(row);
  const secrets = readSubscriptionSecrets(current);
  const snapshot = await refreshNodeSnapshot({
    config: secrets.config,
    urls: secrets.urls,
    storedNodes: secrets.nodes,
    ...buildSubscriptionFetchCallbacks(),
  });
  const refreshResult = prepareRefreshCacheResult({
    config: secrets.config,
    snapshot,
    maxNodesPerSubscription: MAX_NODES_PER_SUBSCRIPTION,
  });

  if (!refreshResult.ok) {
    return {
      ok: false as const,
      response: buildManualRefreshFailureResponse({
        refreshResult,
        maxNodesPerSubscription: MAX_NODES_PER_SUBSCRIPTION,
      }),
    };
  }

  const cachedAt = new Date();
  db()
    .prepare(
      `UPDATE clash_subscriptions
       SET encrypted_nodes = ?, encrypted_config = ?, encrypted_subscription_info = ?,
           last_updated_at = ?, cache_expires_at = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(
      encryptJson(snapshot.nodes),
      encryptJson({ ...secrets.config, sources: snapshot.savedSources }),
      encryptJson(snapshot.subscriptionInfo),
      cachedAt.toISOString(),
      buildSubscriptionCacheExpiry(cachedAt),
      cachedAt.toISOString(),
      current.id
    );

  return {
    ok: true as const,
    body: buildManualRefreshSuccessResponseBody({
      subscriptionId: current.id,
      refreshResult,
      snapshot,
      cachedAt,
    }),
  };
}

export async function generateSubscriptionYaml(token: string): Promise<GeneratedSubscriptionYaml | null> {
  const row = db().prepare("SELECT * FROM clash_subscriptions WHERE token = ?").get(token) as SubscriptionDbRow | undefined;
  if (!row) return null;
  const current = toRow(row);
  const secrets = readSubscriptionSecrets(current);
  const { testUrl, testInterval } = getEffectiveTestOptions(secrets.config);
  const proxyProviders = buildProxyProvidersFromConfig(secrets.config, { testUrl, testInterval });
  if (secrets.nodes.length === 0 && !proxyProviders) return null;
  const yaml = generateClashYaml(
    buildGenerateOptionsFromConfig(secrets.config, {
      nodes: secrets.nodes,
      proxyProviders,
    })
  );
  db()
    .prepare("UPDATE clash_subscriptions SET last_accessed_at = ?, updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), new Date().toISOString(), current.id);
  return {
    yaml,
    name: current.name,
    subscriptionInfo: secrets.subscriptionInfo,
    cacheExpirySeconds: CACHE_TTL_SECONDS,
    autoUpdateIntervalSeconds: null,
    isAdmin: true,
  };
}

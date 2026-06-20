import { randomUUID } from "node:crypto";
import { buildDefaultSubBoostTemplateConfig } from "@subboost/core/config/defaults";
import {
  builtinIdToType,
  getBuiltinTemplateId,
  getBuiltinTemplateSummaryMetadata,
} from "@subboost/core/templates/builtin";
import { getTemplateList } from "@subboost/core/templates";
import { validateSubBoostTemplateConfig } from "@subboost/core/templates/config-template";
import type { SubBoostTemplateConfig } from "@subboost/core/types/template-config";
import type { TemplateTab } from "@subboost/server-core/templates";
import { getDatabase } from "@/lib/database";
import { decryptJsonObject, encryptJson } from "./crypto";

type LocalTemplateTab = Extract<TemplateTab, "default" | "my">;

type LocalTemplateRow = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  encrypted_config: string;
  created_at: string;
  updated_at: string;
};

export type LocalTemplateSummary = {
  id: string;
  name: string;
  description: string;
  downloads: number;
  engagementCount: number;
  createdAt: string;
  tags: string[];
  isOfficial: boolean;
  isPublic: boolean;
  isOwner?: boolean;
  proxyGroupCount: number | null;
  ruleCount: number | null;
};

export type LocalTemplateDetail = {
  id: string;
  name: string;
  description: string;
  kind: "config";
  config: SubBoostTemplateConfig;
};

function db() {
  const database = getDatabase();
  database.exec(`
    CREATE TABLE IF NOT EXISTS clash_templates (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      encrypted_config TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_clash_templates_owner_updated
    ON clash_templates(owner_id, updated_at);
  `);
  return database;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function builtinSummaries(): LocalTemplateSummary[] {
  return getTemplateList().map((template) => ({
    ...getBuiltinTemplateSummaryMetadata(),
    id: getBuiltinTemplateId(template.id),
    name: template.name,
    description: template.description,
    proxyGroupCount: template.groupCount,
    ruleCount: template.ruleCount,
  }));
}

function formatLocalTemplate(row: LocalTemplateRow): LocalTemplateSummary {
  const config = decryptJsonObject(row.encrypted_config);
  const proxyGroupCount = Array.isArray(config.enabledProxyGroups) ? config.enabledProxyGroups.length : null;
  const ruleCount = Array.isArray(config.ruleOrder) ? config.ruleOrder.length : null;
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    downloads: 0,
    engagementCount: 0,
    createdAt: row.created_at,
    tags: ["本地"],
    isOfficial: false,
    isPublic: false,
    isOwner: true,
    proxyGroupCount,
    ruleCount,
  };
}

function filterByIds<T extends { id: string }>(items: T[], ids: string[]): T[] {
  if (ids.length === 0) return items;
  const allowed = new Set(ids);
  return items.filter((item) => allowed.has(item.id));
}

export async function listTemplates(
  ownerId: string | null,
  tab: LocalTemplateTab,
  ids: string[] = []
): Promise<LocalTemplateSummary[]> {
  if (tab === "default") return filterByIds(builtinSummaries(), ids);
  if (!ownerId) throw new Error("Authentication required.");

  const placeholders = ids.map(() => "?").join(",");
  const rows = db()
    .prepare(
      `
      SELECT id, owner_id, name, description, encrypted_config, created_at, updated_at
      FROM clash_templates
      WHERE owner_id = ?
      ${ids.length > 0 ? `AND id IN (${placeholders})` : ""}
      ORDER BY updated_at DESC
    `
    )
    .all(ownerId, ...ids) as LocalTemplateRow[];
  return rows.map(formatLocalTemplate);
}

export async function getTemplateDetail(ownerId: string | null, id: string): Promise<LocalTemplateDetail | null> {
  const builtinType = builtinIdToType(id);
  if (builtinType) {
    const summary = builtinSummaries().find((item) => item.id === id);
    return {
      id,
      name: summary?.name || builtinType,
      description: summary?.description || "",
      kind: "config",
      config: buildDefaultSubBoostTemplateConfig(builtinType),
    };
  }

  if (!ownerId) throw new Error("Authentication required.");
  const row = db()
    .prepare(
      "SELECT id, owner_id, name, description, encrypted_config, created_at, updated_at FROM clash_templates WHERE id = ? AND owner_id = ?"
    )
    .get(id, ownerId) as LocalTemplateRow | undefined;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    kind: "config",
    config: decryptJsonObject(row.encrypted_config) as SubBoostTemplateConfig,
  };
}

export async function createTemplate(ownerId: string, body: unknown): Promise<LocalTemplateSummary> {
  const payload = asRecord(body);
  if (!payload) throw new Error("Invalid request body.");

  const name = asString(payload.name);
  if (!name || name.length > 100) throw new Error("Invalid name.");

  const validated = validateSubBoostTemplateConfig(payload.config);
  if (!validated.ok) throw new Error(validated.error);

  const now = new Date().toISOString();
  const row: LocalTemplateRow = {
    id: randomUUID(),
    owner_id: ownerId,
    name,
    description: asString(payload.description).slice(0, 500),
    encrypted_config: encryptJson(validated.config),
    created_at: now,
    updated_at: now,
  };

  db()
    .prepare(
      "INSERT INTO clash_templates (id, owner_id, name, description, encrypted_config, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(row.id, row.owner_id, row.name, row.description, row.encrypted_config, row.created_at, row.updated_at);

  return formatLocalTemplate(row);
}

export async function deleteTemplate(ownerId: string, id: string): Promise<boolean> {
  const result = db().prepare("DELETE FROM clash_templates WHERE id = ? AND owner_id = ?").run(id, ownerId);
  return result.changes > 0;
}

import "server-only";

import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { CreateEventInput, Event } from "@/lib/events/types";
import { getDatabase } from "@/lib/database";
import { DEFAULT_REMOTE_CONFIGS } from "@/lib/subconverter/default-remote-configs";
import type {
  RemoteConfig,
  RemoteConfigInput,
} from "@/lib/subconverter/types";

interface EventRow {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  date: string;
  participants: string;
  meeting_link: string | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

interface RemoteConfigRow {
  id: string;
  group_name: string;
  label: string;
  url: string;
  enabled: 0 | 1;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function initializeEventsDatabase(): Database.Database {
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      date TEXT NOT NULL,
      participants TEXT NOT NULL DEFAULT '[]',
      meeting_link TEXT,
      timezone TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

    CREATE TABLE IF NOT EXISTS remote_configs (
      id TEXT PRIMARY KEY,
      group_name TEXT NOT NULL,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_remote_configs_group_sort
    ON remote_configs(group_name, sort_order);
  `);
  seedRemoteConfigs(db);

  return db;
}

function rowToEvent(row: EventRow): Event {
  return {
    id: row.id,
    title: row.title,
    startTime: row.start_time,
    endTime: row.end_time,
    date: row.date,
    participants: parseParticipants(row.participants),
    meetingLink: row.meeting_link ?? undefined,
    timezone: row.timezone ?? undefined,
  };
}

function parseParticipants(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function remoteConfigRowToModel(row: RemoteConfigRow): RemoteConfig {
  return {
    id: row.id,
    groupName: row.group_name,
    label: row.label,
    url: row.url,
    enabled: row.enabled === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function seedRemoteConfigs(db: Database.Database): void {
  const count = db
    .prepare("SELECT COUNT(*) as count FROM remote_configs")
    .get() as { count: number };

  if (count.count > 0) {
    return;
  }

  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO remote_configs (
      id, group_name, label, url, enabled, sort_order, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction((configs: RemoteConfigInput[]) => {
    configs.forEach((config) => {
      insert.run(
        randomUUID(),
        config.groupName,
        config.label,
        config.url,
        config.enabled ? 1 : 0,
        config.sortOrder,
        now,
        now
      );
    });
  });

  transaction(DEFAULT_REMOTE_CONFIGS);
}

export function listEventsInRange(start: string, end: string): Event[] {
  const rows = initializeEventsDatabase()
    .prepare(
      `
      SELECT id, title, start_time, end_time, date, participants, meeting_link, timezone, created_at, updated_at
      FROM events
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC, start_time ASC, title ASC
    `
    )
    .all(start, end) as EventRow[];

  return rows.map(rowToEvent);
}

export function createEvent(input: CreateEventInput): Event {
  const now = new Date().toISOString();
  const event: Event = {
    id: randomUUID(),
    title: input.title,
    startTime: input.startTime,
    endTime: input.endTime,
    date: input.date,
    participants: input.participants,
    meetingLink: input.meetingLink,
    timezone: input.timezone,
  };

  initializeEventsDatabase()
    .prepare(
      `
      INSERT INTO events (
        id, title, start_time, end_time, date, participants, meeting_link, timezone, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .run(
      event.id,
      event.title,
      event.startTime,
      event.endTime,
      event.date,
      JSON.stringify(event.participants),
      event.meetingLink ?? null,
      event.timezone ?? null,
      now,
      now
    );

  return event;
}

export function listRemoteConfigs(options?: {
  enabledOnly?: boolean;
}): RemoteConfig[] {
  const rows = initializeEventsDatabase()
    .prepare(
      `
      SELECT id, group_name, label, url, enabled, sort_order, created_at, updated_at
      FROM remote_configs
      ${options?.enabledOnly ? "WHERE enabled = 1" : ""}
      ORDER BY group_name ASC, sort_order ASC, label ASC
    `
    )
    .all() as RemoteConfigRow[];

  return rows.map(remoteConfigRowToModel);
}

export function createRemoteConfig(input: RemoteConfigInput): RemoteConfig {
  const now = new Date().toISOString();
  const remoteConfig: RemoteConfig = {
    id: randomUUID(),
    groupName: input.groupName,
    label: input.label,
    url: input.url,
    enabled: input.enabled,
    sortOrder: input.sortOrder,
    createdAt: now,
    updatedAt: now,
  };

  initializeEventsDatabase()
    .prepare(
      `
      INSERT INTO remote_configs (
        id, group_name, label, url, enabled, sort_order, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .run(
      remoteConfig.id,
      remoteConfig.groupName,
      remoteConfig.label,
      remoteConfig.url,
      remoteConfig.enabled ? 1 : 0,
      remoteConfig.sortOrder,
      now,
      now
    );

  return remoteConfig;
}

export function updateRemoteConfig(
  id: string,
  input: RemoteConfigInput
): RemoteConfig | null {
  const now = new Date().toISOString();
  const result = initializeEventsDatabase()
    .prepare(
      `
      UPDATE remote_configs
      SET group_name = ?, label = ?, url = ?, enabled = ?, sort_order = ?, updated_at = ?
      WHERE id = ?
    `
    )
    .run(
      input.groupName,
      input.label,
      input.url,
      input.enabled ? 1 : 0,
      input.sortOrder,
      now,
      id
    );

  if (result.changes === 0) {
    return null;
  }

  return getRemoteConfig(id);
}

export function deleteRemoteConfig(id: string): boolean {
  const result = initializeEventsDatabase()
    .prepare("DELETE FROM remote_configs WHERE id = ?")
    .run(id);

  return result.changes > 0;
}

function getRemoteConfig(id: string): RemoteConfig | null {
  const row = initializeEventsDatabase()
    .prepare(
      `
      SELECT id, group_name, label, url, enabled, sort_order, created_at, updated_at
      FROM remote_configs
      WHERE id = ?
    `
    )
    .get(id) as RemoteConfigRow | undefined;

  return row ? remoteConfigRowToModel(row) : null;
}

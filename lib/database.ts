import "server-only";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

let database: Database.Database | null = null;

function getDatabasePath(): string {
  const configuredPath = process.env.DATABASE_PATH ?? "./data/subvoid.sqlite";
  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(/* turbopackIgnore: true */ process.cwd(), configuredPath);
}

export function getDatabase(): Database.Database {
  if (database) {
    return database;
  }

  const databasePath = getDatabasePath();
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  database = new Database(databasePath);
  database.pragma("journal_mode = WAL");

  return database;
}

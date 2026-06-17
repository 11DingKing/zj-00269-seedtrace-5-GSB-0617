import { rmSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import type { Express } from "express";
import type Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_DB_PATH = resolve(__dirname, "..", "data", "test-seedtrace.db");

export let app: Express;
export let db: Database.Database;

export async function initTestEnv() {
  process.env.DB_PATH = TEST_DB_PATH;
  process.env.SKIP_SEED = "true";

  mkdirSync(dirname(TEST_DB_PATH), { recursive: true });

  const dbModule = await import("../api/database.js");
  db = dbModule.default;

  const appModule = await import("../api/index.js");
  app = appModule.createApp();

  return { app, db };
}

export function clearDatabase() {
  const tables = [
    "recall_items",
    "recalls",
    "planting_feedbacks",
    "warnings",
    "quality_inspections",
    "dispatch_orders",
    "promotion_sites",
    "seedling_batches",
    "nursery_batches",
    "seed_batches",
    "seed_sources",
  ];

  db.exec("PRAGMA foreign_keys = OFF");
  for (const table of tables) {
    db.prepare(`DELETE FROM ${table}`).run();
  }
  db.exec("PRAGMA foreign_keys = ON");
}

export function cleanupTestDb() {
  try {
    rmSync(TEST_DB_PATH, { force: true });
    rmSync(TEST_DB_PATH + "-shm", { force: true });
    rmSync(TEST_DB_PATH + "-wal", { force: true });
  } catch {
    // ignore
  }
}

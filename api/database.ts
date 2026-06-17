import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";

const DB_PATH = process.env.DB_PATH || "./data/seedtrace.db";

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS seed_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    species TEXT NOT NULL DEFAULT '云杉',
    description TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS seed_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_code TEXT NOT NULL UNIQUE,
    seed_source_id INTEGER NOT NULL REFERENCES seed_sources(id),
    quantity REAL NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    harvest_date TEXT NOT NULL,
    responsible_person TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS nursery_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_code TEXT NOT NULL UNIQUE,
    seed_batch_id INTEGER NOT NULL REFERENCES seed_batches(id),
    nursery_name TEXT NOT NULL,
    quantity REAL NOT NULL,
    planting_date TEXT NOT NULL,
    responsible_person TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS seedling_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_code TEXT NOT NULL UNIQUE,
    nursery_batch_id INTEGER NOT NULL REFERENCES nursery_batches(id),
    quantity REAL NOT NULL,
    out_date TEXT NOT NULL,
    responsible_person TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS promotion_sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    responsible_person TEXT NOT NULL,
    contact_phone TEXT NOT NULL DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS dispatch_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code TEXT NOT NULL UNIQUE,
    seedling_batch_id INTEGER NOT NULL REFERENCES seedling_batches(id),
    promotion_site_id INTEGER NOT NULL REFERENCES promotion_sites(id),
    quantity REAL NOT NULL,
    dispatch_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','delivered','received')),
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS quality_inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_type TEXT NOT NULL CHECK(batch_type IN ('seed','nursery','seedling')),
    batch_id INTEGER NOT NULL,
    result TEXT NOT NULL CHECK(result IN ('qualified','unqualified')),
    items TEXT NOT NULL DEFAULT '',
    "values" TEXT NOT NULL DEFAULT '',
    inspector TEXT NOT NULL,
    inspect_date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_type TEXT NOT NULL CHECK(batch_type IN ('seed','nursery','seedling')),
    batch_id INTEGER NOT NULL,
    batch_code TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    affected_seedling_batches TEXT DEFAULT '[]',
    affected_dispatch_orders TEXT DEFAULT '[]',
    affected_promotion_sites TEXT DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','resolved')),
    created_at TEXT DEFAULT (datetime('now','localtime')),
    resolved_at TEXT
  );

  CREATE TABLE IF NOT EXISTS planting_feedbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dispatch_order_id INTEGER NOT NULL REFERENCES dispatch_orders(id),
    promotion_site_id INTEGER NOT NULL REFERENCES promotion_sites(id),
    seedling_batch_id INTEGER NOT NULL REFERENCES seedling_batches(id),
    nursery_batch_id INTEGER NOT NULL REFERENCES nursery_batches(id),
    seed_batch_id INTEGER NOT NULL REFERENCES seed_batches(id),
    seed_source_id INTEGER NOT NULL REFERENCES seed_sources(id),
    plot_location TEXT NOT NULL DEFAULT '',
    plot_area REAL NOT NULL DEFAULT 0,
    planted_quantity INTEGER NOT NULL DEFAULT 0,
    survival_rate REAL NOT NULL DEFAULT 0,
    growth_status TEXT NOT NULL DEFAULT 'normal' CHECK(growth_status IN ('excellent','good','normal','poor','dead')),
    feedback_date TEXT NOT NULL,
    remark TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_seed_batches_source ON seed_batches(seed_source_id);
  CREATE INDEX IF NOT EXISTS idx_nursery_batches_seed ON nursery_batches(seed_batch_id);
  CREATE INDEX IF NOT EXISTS idx_seedling_batches_nursery ON seedling_batches(nursery_batch_id);
  CREATE INDEX IF NOT EXISTS idx_dispatch_orders_seedling ON dispatch_orders(seedling_batch_id);
  CREATE INDEX IF NOT EXISTS idx_dispatch_orders_site ON dispatch_orders(promotion_site_id);
  CREATE INDEX IF NOT EXISTS idx_quality_batch ON quality_inspections(batch_type, batch_id);
  CREATE INDEX IF NOT EXISTS idx_warnings_status ON warnings(status);
  CREATE INDEX IF NOT EXISTS idx_warnings_batch ON warnings(batch_type, batch_id);
  CREATE INDEX IF NOT EXISTS idx_planting_feedback_order ON planting_feedbacks(dispatch_order_id);
  CREATE INDEX IF NOT EXISTS idx_planting_feedback_site ON planting_feedbacks(promotion_site_id);
  CREATE INDEX IF NOT EXISTS idx_planting_feedback_seedling ON planting_feedbacks(seedling_batch_id);
  CREATE INDEX IF NOT EXISTS idx_planting_feedback_nursery ON planting_feedbacks(nursery_batch_id);
  CREATE INDEX IF NOT EXISTS idx_planting_feedback_seed ON planting_feedbacks(seed_batch_id);
  CREATE INDEX IF NOT EXISTS idx_planting_feedback_source ON planting_feedbacks(seed_source_id);

  CREATE TABLE IF NOT EXISTS recalls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recall_code TEXT NOT NULL UNIQUE,
    batch_type TEXT NOT NULL CHECK(batch_type IN ('seed','nursery','seedling')),
    batch_id INTEGER NOT NULL,
    batch_code TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed','cancelled')),
    affected_seedling_batches TEXT DEFAULT '[]',
    affected_dispatch_orders TEXT DEFAULT '[]',
    affected_promotion_sites TEXT DEFAULT '[]',
    created_by TEXT NOT NULL DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    completed_at TEXT,
    total_items INTEGER NOT NULL DEFAULT 0,
    completed_items INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS recall_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recall_id INTEGER NOT NULL REFERENCES recalls(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK(item_type IN ('seedling_batch','dispatch_order','promotion_site')),
    item_id INTEGER NOT NULL,
    item_code TEXT NOT NULL,
    item_name TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'not_started' CHECK(status IN ('not_started','in_progress','completed','cancelled')),
    disposal_method TEXT CHECK(disposal_method IN ('return','destroy','quarantine','other')),
    disposal_quantity REAL NOT NULL DEFAULT 0,
    handled_by TEXT,
    handled_at TEXT,
    remark TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_recalls_status ON recalls(status);
  CREATE INDEX IF NOT EXISTS idx_recalls_batch ON recalls(batch_type, batch_id);
  CREATE INDEX IF NOT EXISTS idx_recall_items_recall ON recall_items(recall_id);
  CREATE INDEX IF NOT EXISTS idx_recall_items_status ON recall_items(status);
  CREATE INDEX IF NOT EXISTS idx_recall_items_item ON recall_items(item_type, item_id);
`);

export default db;

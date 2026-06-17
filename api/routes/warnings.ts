import { Router } from "express";
import db from "../database.js";

const router = Router();

function computeImpact(batch_type: string, batch_id: number) {
  let affectedSeedlingBatchIds: number[] = [];
  let affectedDispatchOrderIds: number[] = [];
  let affectedPromotionSiteIds: number[] = [];

  if (batch_type === "seed") {
    const nurseryBatches = db
      .prepare("SELECT id FROM nursery_batches WHERE seed_batch_id = ?")
      .all(batch_id) as { id: number }[];
    const nurseryIds = nurseryBatches.map((n) => n.id);
    if (nurseryIds.length > 0) {
      const placeholders = nurseryIds.map(() => "?").join(",");
      const seedlingBatches = db
        .prepare(
          `SELECT id FROM seedling_batches WHERE nursery_batch_id IN (${placeholders})`,
        )
        .all(...nurseryIds) as { id: number }[];
      affectedSeedlingBatchIds = seedlingBatches.map((s) => s.id);
    }
  } else if (batch_type === "nursery") {
    const seedlingBatches = db
      .prepare("SELECT id FROM seedling_batches WHERE nursery_batch_id = ?")
      .all(batch_id) as { id: number }[];
    affectedSeedlingBatchIds = seedlingBatches.map((s) => s.id);
  } else if (batch_type === "seedling") {
    affectedSeedlingBatchIds = [batch_id];
  }

  if (affectedSeedlingBatchIds.length > 0) {
    const placeholders = affectedSeedlingBatchIds.map(() => "?").join(",");
    const dispatchOrders = db
      .prepare(
        `SELECT id, promotion_site_id FROM dispatch_orders WHERE seedling_batch_id IN (${placeholders})`,
      )
      .all(...affectedSeedlingBatchIds) as {
      id: number;
      promotion_site_id: number;
    }[];
    affectedDispatchOrderIds = dispatchOrders.map((d) => d.id);
    affectedPromotionSiteIds = [
      ...new Set(dispatchOrders.map((d) => d.promotion_site_id)),
    ];
  }

  return {
    affectedSeedlingBatchIds,
    affectedDispatchOrderIds,
    affectedPromotionSiteIds,
  };
}

router.get("/", (req, res) => {
  const { status } = req.query;
  let rows: any[];
  if (status) {
    rows = db
      .prepare("SELECT * FROM warnings WHERE status = ? ORDER BY id DESC")
      .all(status);
  } else {
    rows = db.prepare("SELECT * FROM warnings ORDER BY id DESC").all();
  }
  res.json(rows);
});

router.post("/", (req, res) => {
  const { batch_type, batch_id, batch_code, reason } = req.body;
  const impact = computeImpact(batch_type, batch_id);
  const result = db
    .prepare(
      "INSERT INTO warnings (batch_type, batch_id, batch_code, reason, affected_seedling_batches, affected_dispatch_orders, affected_promotion_sites) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      batch_type,
      batch_id,
      batch_code,
      reason || "",
      JSON.stringify(impact.affectedSeedlingBatchIds),
      JSON.stringify(impact.affectedDispatchOrderIds),
      JSON.stringify(impact.affectedPromotionSiteIds),
    );
  const row = db
    .prepare("SELECT * FROM warnings WHERE id = ?")
    .get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.patch("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM warnings WHERE id = ?")
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: "未找到该预警记录" });
  db.prepare(
    "UPDATE warnings SET status = 'resolved', resolved_at = datetime('now','localtime') WHERE id = ?",
  ).run(req.params.id);
  const row = db
    .prepare("SELECT * FROM warnings WHERE id = ?")
    .get(req.params.id);
  res.json(row);
});

router.get("/impact/:batchType/:batchId", (req, res) => {
  const { batchType, batchId } = req.params;
  const impact = computeImpact(batchType, Number(batchId));

  let affectedSeedlingBatches: any[] = [];
  if (impact.affectedSeedlingBatchIds.length > 0) {
    const placeholders = impact.affectedSeedlingBatchIds
      .map(() => "?")
      .join(",");
    affectedSeedlingBatches = db
      .prepare(`SELECT * FROM seedling_batches WHERE id IN (${placeholders})`)
      .all(...impact.affectedSeedlingBatchIds);
  }

  let affectedDispatchOrders: any[] = [];
  if (impact.affectedDispatchOrderIds.length > 0) {
    const placeholders = impact.affectedDispatchOrderIds
      .map(() => "?")
      .join(",");
    affectedDispatchOrders = db
      .prepare(`SELECT * FROM dispatch_orders WHERE id IN (${placeholders})`)
      .all(...impact.affectedDispatchOrderIds);
  }

  let affectedPromotionSites: any[] = [];
  if (impact.affectedPromotionSiteIds.length > 0) {
    const placeholders = impact.affectedPromotionSiteIds
      .map(() => "?")
      .join(",");
    affectedPromotionSites = db
      .prepare(`SELECT * FROM promotion_sites WHERE id IN (${placeholders})`)
      .all(...impact.affectedPromotionSiteIds);
  }

  res.json({
    affected_seedling_batches: affectedSeedlingBatches,
    affected_dispatch_orders: affectedDispatchOrders,
    affected_promotion_sites: affectedPromotionSites,
  });
});

export default router;

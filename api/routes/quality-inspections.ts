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
  const { batch_type, batch_id } = req.query;
  let rows: any[];
  if (batch_type && batch_id) {
    rows = db
      .prepare(
        "SELECT * FROM quality_inspections WHERE batch_type = ? AND batch_id = ? ORDER BY id DESC",
      )
      .all(batch_type, batch_id);
  } else if (batch_type) {
    rows = db
      .prepare(
        "SELECT * FROM quality_inspections WHERE batch_type = ? ORDER BY id DESC",
      )
      .all(batch_type);
  } else {
    rows = db
      .prepare("SELECT * FROM quality_inspections ORDER BY id DESC")
      .all();
  }
  res.json(rows);
});

router.post("/", (req, res) => {
  const {
    batch_type,
    batch_id,
    result,
    items,
    values,
    inspector,
    inspect_date,
  } = req.body;

  const insertResult = db
    .prepare(
      'INSERT INTO quality_inspections (batch_type, batch_id, result, items, "values", inspector, inspect_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .run(
      batch_type,
      batch_id,
      result,
      items || "",
      values || "",
      inspector,
      inspect_date,
    );

  if (result === "unqualified") {
    let batch_code = "";
    if (batch_type === "seed") {
      const row = db
        .prepare("SELECT batch_code FROM seed_batches WHERE id = ?")
        .get(batch_id) as { batch_code: string } | undefined;
      batch_code = row?.batch_code || "";
    } else if (batch_type === "nursery") {
      const row = db
        .prepare("SELECT batch_code FROM nursery_batches WHERE id = ?")
        .get(batch_id) as { batch_code: string } | undefined;
      batch_code = row?.batch_code || "";
    } else if (batch_type === "seedling") {
      const row = db
        .prepare("SELECT batch_code FROM seedling_batches WHERE id = ?")
        .get(batch_id) as { batch_code: string } | undefined;
      batch_code = row?.batch_code || "";
    }

    const impact = computeImpact(batch_type, batch_id);

    db.prepare(
      "INSERT INTO warnings (batch_type, batch_id, batch_code, reason, affected_seedling_batches, affected_dispatch_orders, affected_promotion_sites) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(
      batch_type,
      batch_id,
      batch_code,
      `${batch_type === "seed" ? "种子" : batch_type === "nursery" ? "育苗" : "苗木"}批次 ${batch_code} 质检不合格`,
      JSON.stringify(impact.affectedSeedlingBatchIds),
      JSON.stringify(impact.affectedDispatchOrderIds),
      JSON.stringify(impact.affectedPromotionSiteIds),
    );
  }

  const row = db
    .prepare("SELECT * FROM quality_inspections WHERE id = ?")
    .get(insertResult.lastInsertRowid);
  res.status(201).json(row);
});

export default router;

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

function parseRecallRow(row: any) {
  return {
    ...row,
    affected_seedling_batches: JSON.parse(row.affected_seedling_batches || "[]"),
    affected_dispatch_orders: JSON.parse(row.affected_dispatch_orders || "[]"),
    affected_promotion_sites: JSON.parse(row.affected_promotion_sites || "[]"),
  };
}

function generateRecallCode() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `RCL${year}${month}${day}${random}`;
}

function updateRecallProgress(recallId: number) {
  const items = db
    .prepare("SELECT status FROM recall_items WHERE recall_id = ?")
    .all(recallId) as { status: string }[];

  const total = items.length;
  const completed = items.filter((i) => i.status === "completed").length;
  const inProgress = items.filter((i) => i.status === "in_progress").length;

  let status = "pending";
  if (total > 0) {
    if (completed === total) {
      status = "completed";
    } else if (completed > 0 || inProgress > 0) {
      status = "in_progress";
    }
  }

  db.prepare(
    "UPDATE recalls SET status = ?, total_items = ?, completed_items = ?, completed_at = CASE WHEN ? = 'completed' THEN datetime('now','localtime') ELSE NULL END WHERE id = ?",
  ).run(status, total, completed, status, recallId);
}

router.get("/", (req, res) => {
  const { status } = req.query;
  let rows: any[];
  if (status) {
    rows = db
      .prepare("SELECT * FROM recalls WHERE status = ? ORDER BY id DESC")
      .all(status);
  } else {
    rows = db.prepare("SELECT * FROM recalls ORDER BY id DESC").all();
  }
  res.json(rows.map(parseRecallRow));
});

router.post("/", (req, res) => {
  const { batch_type, batch_id, batch_code, reason, created_by } = req.body;

  if (!batch_type || !batch_id || !batch_code) {
    return res.status(400).json({ error: "缺少必要参数" });
  }

  const impact = computeImpact(batch_type, batch_id);
  const totalItems =
    impact.affectedSeedlingBatchIds.length +
    impact.affectedDispatchOrderIds.length +
    impact.affectedPromotionSiteIds.length;

  if (totalItems === 0) {
    return res.status(400).json({ error: "该批次没有可追溯的下游节点，无需召回" });
  }

  const recallCode = generateRecallCode();

  const tx = db.transaction(() => {
    const result = db
      .prepare(
        "INSERT INTO recalls (recall_code, batch_type, batch_id, batch_code, reason, created_by, affected_seedling_batches, affected_dispatch_orders, affected_promotion_sites, total_items) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        recallCode,
        batch_type,
        batch_id,
        batch_code,
        reason || "",
        created_by || "系统管理员",
        JSON.stringify(impact.affectedSeedlingBatchIds),
        JSON.stringify(impact.affectedDispatchOrderIds),
        JSON.stringify(impact.affectedPromotionSiteIds),
        totalItems,
      );

    const recallId = result.lastInsertRowid as number;

    impact.affectedSeedlingBatchIds.forEach((id) => {
      const batch = db
        .prepare("SELECT batch_code, quantity FROM seedling_batches WHERE id = ?")
        .get(id) as any;
      if (batch) {
        db.prepare(
          "INSERT INTO recall_items (recall_id, item_type, item_id, item_code, item_name, disposal_quantity) VALUES (?, 'seedling_batch', ?, ?, ?, ?)",
        ).run(
          recallId,
          id,
          batch.batch_code,
          `出圃批次 ${batch.batch_code}`,
          batch.quantity || 0,
        );
      }
    });

    impact.affectedDispatchOrderIds.forEach((id) => {
      const order = db
        .prepare(
          "SELECT order_code, quantity FROM dispatch_orders WHERE id = ?",
        )
        .get(id) as any;
      if (order) {
        db.prepare(
          "INSERT INTO recall_items (recall_id, item_type, item_id, item_code, item_name, disposal_quantity) VALUES (?, 'dispatch_order', ?, ?, ?, ?)",
        ).run(
          recallId,
          id,
          order.order_code,
          `调运单 ${order.order_code}`,
          order.quantity || 0,
        );
      }
    });

    impact.affectedPromotionSiteIds.forEach((id) => {
      const site = db
        .prepare("SELECT name, address FROM promotion_sites WHERE id = ?")
        .get(id) as any;
      if (site) {
        db.prepare(
          "INSERT INTO recall_items (recall_id, item_type, item_id, item_code, item_name) VALUES (?, 'promotion_site', ?, ?, ?)",
        ).run(
          recallId,
          id,
          `PS-${id}`,
          `推广点 ${site.name}`,
        );
      }
    });

    return recallId;
  });

  try {
    const recallId = tx();
    updateRecallProgress(recallId);
    const row = db.prepare("SELECT * FROM recalls WHERE id = ?").get(recallId);
    res.status(201).json(parseRecallRow(row));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM recalls WHERE id = ?")
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: "未找到该召回记录" });

  const items = db
    .prepare("SELECT * FROM recall_items WHERE recall_id = ? ORDER BY item_type, id")
    .all(req.params.id);

  const recall = parseRecallRow(row);

  let seedlingBatches: any[] = [];
  if (recall.affected_seedling_batches.length > 0) {
    const placeholders = recall.affected_seedling_batches
      .map(() => "?")
      .join(",");
    seedlingBatches = db
      .prepare(`SELECT * FROM seedling_batches WHERE id IN (${placeholders})`)
      .all(...recall.affected_seedling_batches);
  }

  let dispatchOrders: any[] = [];
  if (recall.affected_dispatch_orders.length > 0) {
    const placeholders = recall.affected_dispatch_orders
      .map(() => "?")
      .join(",");
    dispatchOrders = db
      .prepare(
        `SELECT do.*, ps.name AS promotion_site_name FROM dispatch_orders do LEFT JOIN promotion_sites ps ON do.promotion_site_id = ps.id WHERE do.id IN (${placeholders})`,
      )
      .all(...recall.affected_dispatch_orders);
  }

  let promotionSites: any[] = [];
  if (recall.affected_promotion_sites.length > 0) {
    const placeholders = recall.affected_promotion_sites
      .map(() => "?")
      .join(",");
    promotionSites = db
      .prepare(`SELECT * FROM promotion_sites WHERE id IN (${placeholders})`)
      .all(...recall.affected_promotion_sites);
  }

  res.json({
    ...recall,
    items,
    seedling_batches: seedlingBatches,
    dispatch_orders: dispatchOrders,
    promotion_sites: promotionSites,
  });
});

router.get("/:id/progress", (req, res) => {
  const row = db
    .prepare("SELECT * FROM recalls WHERE id = ?")
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: "未找到该召回记录" });

  const items = db
    .prepare("SELECT status FROM recall_items WHERE recall_id = ?")
    .all(req.params.id) as { status: string }[];

  const total = items.length;
  const notStarted = items.filter((i) => i.status === "not_started").length;
  const inProgress = items.filter((i) => i.status === "in_progress").length;
  const completed = items.filter((i) => i.status === "completed").length;
  const cancelled = items.filter((i) => i.status === "cancelled").length;

  res.json({
    total,
    not_started: notStarted,
    in_progress: inProgress,
    completed,
    cancelled,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  });
});

router.patch("/items/:itemId", (req, res) => {
  const { status, disposal_method, disposal_quantity, handled_by, remark } =
    req.body;

  const existing = db
    .prepare("SELECT * FROM recall_items WHERE id = ?")
    .get(req.params.itemId);
  if (!existing) return res.status(404).json({ error: "未找到该召回项" });

  const updates: string[] = [];
  const values: any[] = [];

  if (status !== undefined) {
    updates.push("status = ?");
    values.push(status);
  }
  if (disposal_method !== undefined) {
    updates.push("disposal_method = ?");
    values.push(disposal_method);
  }
  if (disposal_quantity !== undefined) {
    updates.push("disposal_quantity = ?");
    values.push(disposal_quantity);
  }
  if (handled_by !== undefined) {
    updates.push("handled_by = ?");
    values.push(handled_by);
  }
  if (remark !== undefined) {
    updates.push("remark = ?");
    values.push(remark);
  }

  if (status === "completed" || status === "cancelled") {
    updates.push("handled_at = datetime('now','localtime')");
  }

  updates.push("updated_at = datetime('now','localtime')");
  values.push(req.params.itemId);

  db.prepare(
    `UPDATE recall_items SET ${updates.join(", ")} WHERE id = ?`,
  ).run(...values);

  updateRecallProgress(existing.recall_id);

  const updated = db
    .prepare("SELECT * FROM recall_items WHERE id = ?")
    .get(req.params.itemId);
  res.json(updated);
});

router.patch("/:id/cancel", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM recalls WHERE id = ?")
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: "未找到该召回记录" });

  const tx = db.transaction(() => {
    db.prepare(
      "UPDATE recall_items SET status = 'cancelled', handled_at = datetime('now','localtime'), updated_at = datetime('now','localtime') WHERE recall_id = ? AND status = 'not_started'",
    ).run(req.params.id);

    db.prepare(
      "UPDATE recalls SET status = 'cancelled', completed_at = datetime('now','localtime') WHERE id = ?",
    ).run(req.params.id);
  });

  try {
    tx();
    updateRecallProgress(existing.id);
    const row = db.prepare("SELECT * FROM recalls WHERE id = ?").get(req.params.id);
    res.json(parseRecallRow(row));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM recalls WHERE id = ?")
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: "未找到该召回记录" });

  const tx = db.transaction(() => {
    db.prepare("DELETE FROM recall_items WHERE recall_id = ?").run(req.params.id);
    db.prepare("DELETE FROM recalls WHERE id = ?").run(req.params.id);
  });

  try {
    tx();
    res.json({ message: "召回记录已删除" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/batch/:batchType/:batchId", (req, res) => {
  const { batchType, batchId } = req.params;
  const rows = db
    .prepare(
      "SELECT * FROM recalls WHERE batch_type = ? AND batch_id = ? ORDER BY id DESC",
    )
    .all(batchType, batchId);
  res.json(rows.map(parseRecallRow));
});

export default router;

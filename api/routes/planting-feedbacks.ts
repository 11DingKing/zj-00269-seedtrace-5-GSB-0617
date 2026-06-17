import { Router } from "express";
import db from "../database.js";

const router = Router();

router.get("/", (req, res) => {
  const { promotion_site_id, seed_source_id, seedling_batch_id } = req.query;

  let sql = `
    SELECT pf.*,
      ps.name AS promotion_site_name, ps.address AS promotion_site_address,
      do.order_code AS dispatch_order_code, do.quantity AS dispatch_quantity,
      slb.batch_code AS seedling_batch_code,
      nb.batch_code AS nursery_batch_code, nb.nursery_name,
      sb.batch_code AS seed_batch_code,
      ss.name AS seed_source_name, ss.species, ss.location AS seed_source_location
    FROM planting_feedbacks pf
    LEFT JOIN promotion_sites ps ON pf.promotion_site_id = ps.id
    LEFT JOIN dispatch_orders do ON pf.dispatch_order_id = do.id
    LEFT JOIN seedling_batches slb ON pf.seedling_batch_id = slb.id
    LEFT JOIN nursery_batches nb ON pf.nursery_batch_id = nb.id
    LEFT JOIN seed_batches sb ON pf.seed_batch_id = sb.id
    LEFT JOIN seed_sources ss ON pf.seed_source_id = ss.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (promotion_site_id) {
    sql += " AND pf.promotion_site_id = ?";
    params.push(Number(promotion_site_id));
  }
  if (seed_source_id) {
    sql += " AND pf.seed_source_id = ?";
    params.push(Number(seed_source_id));
  }
  if (seedling_batch_id) {
    sql += " AND pf.seedling_batch_id = ?";
    params.push(Number(seedling_batch_id));
  }

  sql += " ORDER BY pf.id DESC";

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.get("/:id", (req, res) => {
  const row = db
    .prepare(
      `
    SELECT pf.*,
      ps.name AS promotion_site_name, ps.address AS promotion_site_address,
      do.order_code AS dispatch_order_code, do.quantity AS dispatch_quantity,
      slb.batch_code AS seedling_batch_code,
      nb.batch_code AS nursery_batch_code, nb.nursery_name,
      sb.batch_code AS seed_batch_code,
      ss.name AS seed_source_name, ss.species
    FROM planting_feedbacks pf
    LEFT JOIN promotion_sites ps ON pf.promotion_site_id = ps.id
    LEFT JOIN dispatch_orders do ON pf.dispatch_order_id = do.id
    LEFT JOIN seedling_batches slb ON pf.seedling_batch_id = slb.id
    LEFT JOIN nursery_batches nb ON pf.nursery_batch_id = nb.id
    LEFT JOIN seed_batches sb ON pf.seed_batch_id = sb.id
    LEFT JOIN seed_sources ss ON pf.seed_source_id = ss.id
    WHERE pf.id = ?
  `,
    )
    .get(req.params.id);

  if (!row) {
    return res.status(404).json({ error: "未找到该反馈记录" });
  }
  res.json(row);
});

router.post("/", (req, res) => {
  const {
    dispatch_order_id,
    plot_location,
    plot_area,
    planted_quantity,
    survival_rate,
    growth_status,
    feedback_date,
    remark,
  } = req.body;

  if (!dispatch_order_id) {
    return res.status(400).json({ error: "请选择调运单" });
  }

  const dispatchOrder = db
    .prepare("SELECT * FROM dispatch_orders WHERE id = ?")
    .get(dispatch_order_id) as any;

  if (!dispatchOrder) {
    return res.status(404).json({ error: "调运单不存在" });
  }

  const seedlingBatch = db
    .prepare("SELECT * FROM seedling_batches WHERE id = ?")
    .get(dispatchOrder.seedling_batch_id) as any;

  if (!seedlingBatch) {
    return res.status(404).json({ error: "出圃批次不存在" });
  }

  const nurseryBatch = db
    .prepare("SELECT * FROM nursery_batches WHERE id = ?")
    .get(seedlingBatch.nursery_batch_id) as any;

  const seedBatch = db
    .prepare("SELECT * FROM seed_batches WHERE id = ?")
    .get(nurseryBatch.seed_batch_id) as any;

  const result = db
    .prepare(
      `
    INSERT INTO planting_feedbacks (
      dispatch_order_id, promotion_site_id, seedling_batch_id,
      nursery_batch_id, seed_batch_id, seed_source_id,
      plot_location, plot_area, planted_quantity,
      survival_rate, growth_status, feedback_date, remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    )
    .run(
      dispatch_order_id,
      dispatchOrder.promotion_site_id,
      dispatchOrder.seedling_batch_id,
      nurseryBatch.id,
      seedBatch.id,
      seedBatch.seed_source_id,
      plot_location || "",
      plot_area || 0,
      planted_quantity || 0,
      survival_rate || 0,
      growth_status || "normal",
      feedback_date,
      remark || "",
    );

  const row = db
    .prepare("SELECT * FROM planting_feedbacks WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(row);
});

router.patch("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM planting_feedbacks WHERE id = ?")
    .get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: "未找到该反馈记录" });
  }

  const {
    plot_location,
    plot_area,
    planted_quantity,
    survival_rate,
    growth_status,
    feedback_date,
    remark,
  } = req.body;

  db.prepare(
    `
    UPDATE planting_feedbacks SET
      plot_location = COALESCE(?, plot_location),
      plot_area = COALESCE(?, plot_area),
      planted_quantity = COALESCE(?, planted_quantity),
      survival_rate = COALESCE(?, survival_rate),
      growth_status = COALESCE(?, growth_status),
      feedback_date = COALESCE(?, feedback_date),
      remark = COALESCE(?, remark),
      updated_at = datetime('now','localtime')
    WHERE id = ?
  `,
  ).run(
    plot_location,
    plot_area,
    planted_quantity,
    survival_rate,
    growth_status,
    feedback_date,
    remark,
    req.params.id,
  );

  const row = db
    .prepare("SELECT * FROM planting_feedbacks WHERE id = ?")
    .get(req.params.id);

  res.json(row);
});

router.delete("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM planting_feedbacks WHERE id = ?")
    .get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: "未找到该反馈记录" });
  }

  db.prepare("DELETE FROM planting_feedbacks WHERE id = ?").run(req.params.id);
  res.json({ message: "删除成功" });
});

export default router;

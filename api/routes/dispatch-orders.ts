import { Router } from "express";
import db from "../database.js";

const router = Router();

router.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `
    SELECT do.*, slb.batch_code AS seedling_batch_code, slb.quantity AS seedling_quantity,
      ps.name AS promotion_site_name, ps.address AS promotion_site_address
    FROM dispatch_orders do
    LEFT JOIN seedling_batches slb ON do.seedling_batch_id = slb.id
    LEFT JOIN promotion_sites ps ON do.promotion_site_id = ps.id
    ORDER BY do.id DESC
  `,
    )
    .all();
  res.json(rows);
});

router.post("/", (req, res) => {
  const { seedling_batch_id, promotion_site_id, quantity, dispatch_date } =
    req.body;
  const order_code = "DY" + Date.now();
  const result = db
    .prepare(
      "INSERT INTO dispatch_orders (order_code, seedling_batch_id, promotion_site_id, quantity, dispatch_date) VALUES (?, ?, ?, ?, ?)",
    )
    .run(
      order_code,
      seedling_batch_id,
      promotion_site_id,
      quantity,
      dispatch_date,
    );
  const row = db
    .prepare("SELECT * FROM dispatch_orders WHERE id = ?")
    .get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.patch("/:id", (req, res) => {
  const { status } = req.body;
  const existing = db
    .prepare("SELECT * FROM dispatch_orders WHERE id = ?")
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: "未找到该调拨单" });
  db.prepare(
    "UPDATE dispatch_orders SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?",
  ).run(status, req.params.id);
  const row = db
    .prepare("SELECT * FROM dispatch_orders WHERE id = ?")
    .get(req.params.id);
  res.json(row);
});

export default router;

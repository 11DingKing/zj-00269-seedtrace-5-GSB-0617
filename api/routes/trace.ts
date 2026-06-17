import { Router } from "express";
import db from "../database.js";

const router = Router();

router.get("/", (req, res) => {
  const { batchCode } = req.query;
  if (!batchCode || typeof batchCode !== "string") {
    return res.status(400).json({ error: "请提供 batchCode 参数" });
  }

  let seedBatch = db
    .prepare("SELECT * FROM seed_batches WHERE batch_code = ?")
    .get(batchCode) as any;
  let nurseryBatch = db
    .prepare("SELECT * FROM nursery_batches WHERE batch_code = ?")
    .get(batchCode) as any;
  let seedlingBatch = db
    .prepare("SELECT * FROM seedling_batches WHERE batch_code = ?")
    .get(batchCode) as any;
  const dispatchOrder = db
    .prepare("SELECT * FROM dispatch_orders WHERE order_code = ?")
    .get(batchCode) as any;

  if (dispatchOrder) {
    seedlingBatch = db
      .prepare("SELECT * FROM seedling_batches WHERE id = ?")
      .get(dispatchOrder.seedling_batch_id) as any;
  }

  if (seedlingBatch) {
    nurseryBatch = db
      .prepare("SELECT * FROM nursery_batches WHERE id = ?")
      .get(seedlingBatch.nursery_batch_id) as any;
  }

  if (nurseryBatch) {
    seedBatch = db
      .prepare("SELECT * FROM seed_batches WHERE id = ?")
      .get(nurseryBatch.seed_batch_id) as any;
  }

  if (!seedBatch) {
    return res.status(404).json({ error: "未找到该批次号的溯源信息" });
  }

  if (!nurseryBatch && seedBatch) {
    nurseryBatch = db
      .prepare("SELECT * FROM nursery_batches WHERE seed_batch_id = ?")
      .get(seedBatch.id) as any;
  }

  if (!seedlingBatch && nurseryBatch) {
    seedlingBatch = db
      .prepare("SELECT * FROM seedling_batches WHERE nursery_batch_id = ?")
      .get(nurseryBatch.id) as any;
  }

  const seed_source = db
    .prepare("SELECT * FROM seed_sources WHERE id = ?")
    .get(seedBatch.seed_source_id) as any;
  const dispatch_orders = db
    .prepare(
      "SELECT do.*, ps.name AS promotion_site_name, ps.address AS promotion_site_address, ps.responsible_person AS promotion_site_responsible_person, ps.contact_phone AS promotion_site_contact_phone, ps.created_at AS promotion_site_created_at, ps.updated_at AS promotion_site_updated_at FROM dispatch_orders do LEFT JOIN promotion_sites ps ON do.promotion_site_id = ps.id WHERE do.seedling_batch_id = ?",
    )
    .all(seedlingBatch?.id) as any[];

  const promotion_sites = dispatch_orders
    .map((d) => ({
      id: d.promotion_site_id,
      name: d.promotion_site_name,
      address: d.promotion_site_address,
      responsible_person: d.promotion_site_responsible_person,
      contact_phone: d.promotion_site_contact_phone,
      created_at: d.promotion_site_created_at,
      updated_at: d.promotion_site_updated_at,
    }))
    .filter((p, i, arr) => p.id && arr.findIndex((x) => x.id === p.id) === i);

  res.json({
    seed_source,
    seed_batch: seedBatch,
    nursery_batch: nurseryBatch || null,
    seedling_batch: seedlingBatch || null,
    dispatch_orders,
    promotion_sites,
  });
});

export default router;

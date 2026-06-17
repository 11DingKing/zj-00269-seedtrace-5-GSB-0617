import { Router } from "express";
import db from "../database.js";

const router = Router();

router.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `
    SELECT slb.*, nb.batch_code AS nursery_batch_code, nb.seed_batch_id, nb.nursery_name,
      sb.batch_code AS seed_batch_code, sb.seed_source_id,
      ss.name AS seed_source_name, ss.location AS seed_source_location, ss.species AS seed_source_species
    FROM seedling_batches slb
    LEFT JOIN nursery_batches nb ON slb.nursery_batch_id = nb.id
    LEFT JOIN seed_batches sb ON nb.seed_batch_id = sb.id
    LEFT JOIN seed_sources ss ON sb.seed_source_id = ss.id
    ORDER BY slb.id DESC
  `,
    )
    .all();
  res.json(rows);
});

router.get("/:id", (req, res) => {
  const row = db
    .prepare(
      `
    SELECT slb.*, nb.batch_code AS nursery_batch_code, nb.seed_batch_id, nb.nursery_name,
      nb.quantity AS nursery_quantity, nb.planting_date, nb.responsible_person AS nursery_responsible_person,
      nb.created_at AS nursery_created_at, nb.updated_at AS nursery_updated_at,
      sb.batch_code AS seed_batch_code, sb.seed_source_id, sb.quantity AS seed_quantity,
      sb.unit, sb.harvest_date, sb.responsible_person AS seed_responsible_person,
      sb.created_at AS seed_created_at, sb.updated_at AS seed_updated_at,
      ss.id AS seed_source_id_full, ss.name AS seed_source_name, ss.location AS seed_source_location,
      ss.species AS seed_source_species, ss.description AS seed_source_description,
      ss.created_at AS seed_source_created_at, ss.updated_at AS seed_source_updated_at
    FROM seedling_batches slb
    LEFT JOIN nursery_batches nb ON slb.nursery_batch_id = nb.id
    LEFT JOIN seed_batches sb ON nb.seed_batch_id = sb.id
    LEFT JOIN seed_sources ss ON sb.seed_source_id = ss.id
    WHERE slb.id = ?
  `,
    )
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: "未找到该苗木批次" });
  const seed_source = {
    id: row.seed_source_id_full,
    name: row.seed_source_name,
    location: row.seed_source_location,
    species: row.seed_source_species,
    description: row.seed_source_description,
    created_at: row.seed_source_created_at,
    updated_at: row.seed_source_updated_at,
  };
  const seed_batch = {
    id: row.seed_batch_id,
    batch_code: row.seed_batch_code,
    seed_source_id: row.seed_source_id,
    quantity: row.seed_quantity,
    unit: row.unit,
    harvest_date: row.harvest_date,
    responsible_person: row.seed_responsible_person,
    created_at: row.seed_created_at,
    updated_at: row.seed_updated_at,
    seed_source,
  };
  const nursery_batch = {
    id: row.nursery_batch_id,
    batch_code: row.nursery_batch_code,
    seed_batch_id: row.seed_batch_id,
    nursery_name: row.nursery_name,
    quantity: row.nursery_quantity,
    planting_date: row.planting_date,
    responsible_person: row.nursery_responsible_person,
    created_at: row.nursery_created_at,
    updated_at: row.nursery_updated_at,
    seed_batch,
  };
  const quality_inspections = db
    .prepare(
      "SELECT * FROM quality_inspections WHERE batch_type = ? AND batch_id = ?",
    )
    .all("seedling", row.id);
  const {
    nursery_batch_code,
    seed_batch_id,
    nursery_name,
    nursery_quantity,
    planting_date,
    nursery_responsible_person,
    nursery_created_at,
    nursery_updated_at,
    seed_batch_code,
    seed_source_id,
    seed_quantity,
    unit,
    harvest_date,
    seed_responsible_person,
    seed_created_at,
    seed_updated_at,
    seed_source_id_full,
    seed_source_name,
    seed_source_location,
    seed_source_species,
    seed_source_description,
    seed_source_created_at,
    seed_source_updated_at,
    ...rest
  } = row;
  res.json({ ...rest, nursery_batch, quality_inspections });
});

router.post("/", (req, res) => {
  const {
    batch_code,
    nursery_batch_id,
    quantity,
    out_date,
    responsible_person,
  } = req.body;
  const result = db
    .prepare(
      "INSERT INTO seedling_batches (batch_code, nursery_batch_id, quantity, out_date, responsible_person) VALUES (?, ?, ?, ?, ?)",
    )
    .run(batch_code, nursery_batch_id, quantity, out_date, responsible_person);
  const row = db
    .prepare("SELECT * FROM seedling_batches WHERE id = ?")
    .get(result.lastInsertRowid);
  res.status(201).json(row);
});

export default router;

import { Router } from "express";
import db from "../database.js";

const router = Router();

router.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `
    SELECT nb.*, sb.batch_code AS seed_batch_code, sb.seed_source_id,
      ss.name AS seed_source_name, ss.location AS seed_source_location, ss.species AS seed_source_species
    FROM nursery_batches nb
    LEFT JOIN seed_batches sb ON nb.seed_batch_id = sb.id
    LEFT JOIN seed_sources ss ON sb.seed_source_id = ss.id
    ORDER BY nb.id DESC
  `,
    )
    .all();
  res.json(rows);
});

router.get("/:id", (req, res) => {
  const row = db
    .prepare(
      `
    SELECT nb.*, sb.batch_code AS seed_batch_code, sb.seed_source_id, sb.quantity AS seed_quantity,
      sb.unit, sb.harvest_date, sb.responsible_person AS seed_responsible_person,
      sb.created_at AS seed_created_at, sb.updated_at AS seed_updated_at,
      ss.id AS seed_source_id_full, ss.name AS seed_source_name, ss.location AS seed_source_location,
      ss.species AS seed_source_species, ss.description AS seed_source_description,
      ss.created_at AS seed_source_created_at, ss.updated_at AS seed_source_updated_at
    FROM nursery_batches nb
    LEFT JOIN seed_batches sb ON nb.seed_batch_id = sb.id
    LEFT JOIN seed_sources ss ON sb.seed_source_id = ss.id
    WHERE nb.id = ?
  `,
    )
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: "未找到该育苗批次" });
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
  const quality_inspections = db
    .prepare(
      "SELECT * FROM quality_inspections WHERE batch_type = ? AND batch_id = ?",
    )
    .all("nursery", row.id);
  const {
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
  res.json({ ...rest, seed_batch, quality_inspections });
});

router.post("/", (req, res) => {
  const {
    batch_code,
    seed_batch_id,
    nursery_name,
    quantity,
    planting_date,
    responsible_person,
  } = req.body;
  const result = db
    .prepare(
      "INSERT INTO nursery_batches (batch_code, seed_batch_id, nursery_name, quantity, planting_date, responsible_person) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(
      batch_code,
      seed_batch_id,
      nursery_name,
      quantity,
      planting_date,
      responsible_person,
    );
  const row = db
    .prepare("SELECT * FROM nursery_batches WHERE id = ?")
    .get(result.lastInsertRowid);
  res.status(201).json(row);
});

export default router;

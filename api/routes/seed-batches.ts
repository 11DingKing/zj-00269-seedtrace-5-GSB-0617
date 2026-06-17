import { Router } from "express";
import db from "../database.js";

const router = Router();

router.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `
    SELECT sb.*, ss.name AS seed_source_name, ss.location AS seed_source_location, ss.species AS seed_source_species
    FROM seed_batches sb
    LEFT JOIN seed_sources ss ON sb.seed_source_id = ss.id
    ORDER BY sb.id DESC
  `,
    )
    .all();
  res.json(rows);
});

router.get("/:id", (req, res) => {
  const row = db
    .prepare(
      `
    SELECT sb.*, ss.name AS seed_source_name, ss.location AS seed_source_location, ss.species AS seed_source_species,
      ss.id AS seed_source_id_full, ss.description AS seed_source_description,
      ss.created_at AS seed_source_created_at, ss.updated_at AS seed_source_updated_at
    FROM seed_batches sb
    LEFT JOIN seed_sources ss ON sb.seed_source_id = ss.id
    WHERE sb.id = ?
  `,
    )
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: "未找到该种子批次" });
  const seed_source = {
    id: row.seed_source_id,
    name: row.seed_source_name,
    location: row.seed_source_location,
    species: row.seed_source_species,
    description: row.seed_source_description,
    created_at: row.seed_source_created_at,
    updated_at: row.seed_source_updated_at,
  };
  const quality_inspections = db
    .prepare(
      "SELECT * FROM quality_inspections WHERE batch_type = ? AND batch_id = ?",
    )
    .all("seed", row.id);
  const {
    seed_source_name,
    seed_source_location,
    seed_source_species,
    seed_source_id_full,
    seed_source_description,
    seed_source_created_at,
    seed_source_updated_at,
    ...rest
  } = row;
  res.json({ ...rest, seed_source, quality_inspections });
});

router.post("/", (req, res) => {
  const {
    batch_code,
    seed_source_id,
    quantity,
    unit,
    harvest_date,
    responsible_person,
  } = req.body;
  const result = db
    .prepare(
      "INSERT INTO seed_batches (batch_code, seed_source_id, quantity, unit, harvest_date, responsible_person) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(
      batch_code,
      seed_source_id,
      quantity,
      unit || "kg",
      harvest_date,
      responsible_person,
    );
  const row = db
    .prepare("SELECT * FROM seed_batches WHERE id = ?")
    .get(result.lastInsertRowid);
  res.status(201).json(row);
});

export default router;

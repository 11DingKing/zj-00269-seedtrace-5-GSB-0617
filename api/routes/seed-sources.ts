import { Router } from "express";
import db from "../database.js";

const router = Router();

router.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM seed_sources ORDER BY id DESC").all();
  res.json(rows);
});

router.get("/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM seed_sources WHERE id = ?")
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: "未找到该种子来源" });
  res.json(row);
});

router.post("/", (req, res) => {
  const { name, location, species, description } = req.body;
  const result = db
    .prepare(
      "INSERT INTO seed_sources (name, location, species, description) VALUES (?, ?, ?, ?)",
    )
    .run(name, location, species || "云杉", description || "");
  const row = db
    .prepare("SELECT * FROM seed_sources WHERE id = ?")
    .get(result.lastInsertRowid);
  res.status(201).json(row);
});

export default router;

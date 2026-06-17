import { Router } from "express";
import db from "../database.js";

const router = Router();

router.get("/", (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM promotion_sites ORDER BY id DESC")
    .all();
  res.json(rows);
});

router.get("/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM promotion_sites WHERE id = ?")
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: "未找到该推广站点" });
  res.json(row);
});

router.post("/", (req, res) => {
  const { name, address, responsible_person, contact_phone } = req.body;
  const result = db
    .prepare(
      "INSERT INTO promotion_sites (name, address, responsible_person, contact_phone) VALUES (?, ?, ?, ?)",
    )
    .run(name, address, responsible_person, contact_phone || "");
  const row = db
    .prepare("SELECT * FROM promotion_sites WHERE id = ?")
    .get(result.lastInsertRowid);
  res.status(201).json(row);
});

export default router;

import { Router } from "express";
import db from "../database.js";

const router = Router();

router.get("/dashboard", (_req, res) => {
  const seed_source_count = (
    db.prepare("SELECT COUNT(*) AS count FROM seed_sources").get() as any
  ).count;
  const seed_batch_count = (
    db.prepare("SELECT COUNT(*) AS count FROM seed_batches").get() as any
  ).count;
  const nursery_batch_count = (
    db.prepare("SELECT COUNT(*) AS count FROM nursery_batches").get() as any
  ).count;
  const seedling_batch_count = (
    db.prepare("SELECT COUNT(*) AS count FROM seedling_batches").get() as any
  ).count;
  const dispatch_order_count = (
    db.prepare("SELECT COUNT(*) AS count FROM dispatch_orders").get() as any
  ).count;
  const promotion_site_count = (
    db.prepare("SELECT COUNT(*) AS count FROM promotion_sites").get() as any
  ).count;
  const active_warning_count = (
    db
      .prepare("SELECT COUNT(*) AS count FROM warnings WHERE status = 'active'")
      .get() as any
  ).count;

  res.json({
    seed_source_count,
    seed_batch_count,
    nursery_batch_count,
    seedling_batch_count,
    dispatch_order_count,
    promotion_site_count,
    active_warning_count,
  });
});

router.get("/nursery", (_req, res) => {
  const rows = db
    .prepare(
      `
    SELECT nb.nursery_name,
      SUM(nb.quantity) AS nursery_quantity,
      COALESCE(slb.seedling_quantity, 0) AS seedling_quantity,
      COALESCE(w.problem_count, 0) AS problem_count
    FROM nursery_batches nb
    LEFT JOIN (
      SELECT nursery_batch_id, SUM(quantity) AS seedling_quantity
      FROM seedling_batches
      GROUP BY nursery_batch_id
    ) slb ON nb.id = slb.nursery_batch_id
    LEFT JOIN (
      SELECT batch_id, COUNT(*) AS problem_count
      FROM quality_inspections
      WHERE batch_type = 'nursery' AND result = 'unqualified'
      GROUP BY batch_id
    ) w ON nb.id = w.batch_id
    GROUP BY nb.nursery_name
  `,
    )
    .all();

  const result = rows.map((r: any) => ({
    nursery_name: r.nursery_name,
    nursery_quantity: r.nursery_quantity,
    seedling_quantity: r.seedling_quantity || 0,
    problem_count: r.problem_count || 0,
  }));

  res.json(result);
});

router.get("/promotion-site", (_req, res) => {
  const sites = db
    .prepare("SELECT * FROM promotion_sites ORDER BY id")
    .all() as any[];

  const result = sites.map((site) => {
    const orders = db
      .prepare(
        `
      SELECT do.quantity, slb.nursery_batch_id, nb.nursery_name
      FROM dispatch_orders do
      LEFT JOIN seedling_batches slb ON do.seedling_batch_id = slb.id
      LEFT JOIN nursery_batches nb ON slb.nursery_batch_id = nb.id
      WHERE do.promotion_site_id = ? AND do.status = 'received'
    `,
      )
      .all(site.id) as any[];

    const received_quantity = orders.reduce((sum, o) => sum + o.quantity, 0);
    const source_nurseries = [
      ...new Set(orders.map((o) => o.nursery_name).filter(Boolean)),
    ];

    const warnings = db
      .prepare(
        `
      SELECT affected_promotion_sites FROM warnings WHERE status = 'active'
    `,
      )
      .all() as any[];

    let affected_count = 0;
    for (const w of warnings) {
      try {
        const ids: number[] = JSON.parse(w.affected_promotion_sites);
        if (ids.includes(site.id)) affected_count++;
      } catch {
        /* skip */
      }
    }

    return {
      site_name: site.name,
      received_quantity,
      source_nurseries,
      affected_count,
    };
  });

  res.json(result);
});

router.get("/seed-source-effectiveness", (req, res) => {
  const { seed_source_id } = req.query;

  let sql = `
    SELECT ss.id AS seed_source_id, ss.name AS seed_source_name, ss.species,
      COALESCE(SUM(pf.plot_area), 0) AS total_plot_area,
      COALESCE(SUM(pf.planted_quantity), 0) AS total_planted_quantity,
      COALESCE(AVG(pf.survival_rate), 0) AS avg_survival_rate,
      COUNT(pf.id) AS feedback_count,
      COUNT(DISTINCT pf.promotion_site_id) AS promotion_site_count
    FROM seed_sources ss
    LEFT JOIN planting_feedbacks pf ON ss.id = pf.seed_source_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (seed_source_id) {
    sql += " AND ss.id = ?";
    params.push(Number(seed_source_id));
  }

  sql += " GROUP BY ss.id, ss.name, ss.species ORDER BY ss.id";

  const summaryRows = db.prepare(sql).all(...params) as any[];

  const result = summaryRows.map((row) => {
    const growthDistSql = `
      SELECT growth_status, COUNT(*) AS count
      FROM planting_feedbacks
      WHERE seed_source_id = ?
      GROUP BY growth_status
    `;
    const growthRows = db
      .prepare(growthDistSql)
      .all(row.seed_source_id) as any[];

    const growth_distribution = {
      excellent: 0,
      good: 0,
      normal: 0,
      poor: 0,
      dead: 0,
    };
    for (const g of growthRows) {
      if (g.growth_status in growth_distribution) {
        (growth_distribution as any)[g.growth_status] = g.count;
      }
    }

    const siteDetailsSql = `
      SELECT pf.promotion_site_id, ps.name AS promotion_site_name,
        COALESCE(SUM(pf.plot_area), 0) AS plot_area,
        COALESCE(SUM(pf.planted_quantity), 0) AS planted_quantity,
        COALESCE(AVG(pf.survival_rate), 0) AS avg_survival_rate,
        COUNT(pf.id) AS feedback_count,
        MAX(pf.feedback_date) AS latest_feedback_date
      FROM planting_feedbacks pf
      LEFT JOIN promotion_sites ps ON pf.promotion_site_id = ps.id
      WHERE pf.seed_source_id = ?
      GROUP BY pf.promotion_site_id, ps.name
      ORDER BY pf.promotion_site_id
    `;
    const siteRows = db
      .prepare(siteDetailsSql)
      .all(row.seed_source_id) as any[];

    const site_details = siteRows.map((site) => {
      const batchCodesSql = `
        SELECT DISTINCT slb.batch_code
        FROM planting_feedbacks pf
        LEFT JOIN seedling_batches slb ON pf.seedling_batch_id = slb.id
        WHERE pf.seed_source_id = ? AND pf.promotion_site_id = ?
      `;
      const batchRows = db
        .prepare(batchCodesSql)
        .all(row.seed_source_id, site.promotion_site_id) as any[];

      return {
        promotion_site_id: site.promotion_site_id,
        promotion_site_name: site.promotion_site_name,
        plot_area: site.plot_area || 0,
        planted_quantity: site.planted_quantity || 0,
        avg_survival_rate: site.avg_survival_rate || 0,
        feedback_count: site.feedback_count || 0,
        latest_feedback_date: site.latest_feedback_date || "",
        seedling_batch_codes: batchRows
          .map((b) => b.batch_code)
          .filter(Boolean),
      };
    });

    return {
      seed_source_id: row.seed_source_id,
      seed_source_name: row.seed_source_name,
      species: row.species,
      total_plot_area: row.total_plot_area || 0,
      total_planted_quantity: row.total_planted_quantity || 0,
      avg_survival_rate: row.avg_survival_rate || 0,
      feedback_count: row.feedback_count || 0,
      promotion_site_count: row.promotion_site_count || 0,
      growth_distribution,
      site_details,
    };
  });

  if (seed_source_id && result.length === 1) {
    res.json(result[0]);
  } else {
    res.json(result);
  }
});

export default router;

import express from "express";
import cors from "cors";
import { existsSync } from "fs";
import { resolve } from "path";
import seedSourcesRouter from "./routes/seed-sources.js";
import seedBatchesRouter from "./routes/seed-batches.js";
import nurseryBatchesRouter from "./routes/nursery-batches.js";
import seedlingBatchesRouter from "./routes/seedling-batches.js";
import dispatchOrdersRouter from "./routes/dispatch-orders.js";
import promotionSitesRouter from "./routes/promotion-sites.js";
import qualityInspectionsRouter from "./routes/quality-inspections.js";
import traceRouter from "./routes/trace.js";
import warningsRouter from "./routes/warnings.js";
import statisticsRouter from "./routes/statistics.js";
import plantingFeedbacksRouter from "./routes/planting-feedbacks.js";
import recallsRouter from "./routes/recalls.js";
import { closeDatabase } from "./database.js";
import "./seed.js";

const PORT = parseInt(process.env.PORT || "3001", 10);
const STATIC_DIR = process.env.STATIC_DIR
  ? resolve(process.env.STATIC_DIR)
  : resolve(process.cwd(), "dist");

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/seed-sources", seedSourcesRouter);
  app.use("/api/seed-batches", seedBatchesRouter);
  app.use("/api/nursery-batches", nurseryBatchesRouter);
  app.use("/api/seedling-batches", seedlingBatchesRouter);
  app.use("/api/dispatch-orders", dispatchOrdersRouter);
  app.use("/api/promotion-sites", promotionSitesRouter);
  app.use("/api/quality-inspections", qualityInspectionsRouter);
  app.use("/api/trace", traceRouter);
  app.use("/api/warnings", warningsRouter);
  app.use("/api/statistics", statisticsRouter);
  app.use("/api/planting-feedbacks", plantingFeedbacksRouter);
  app.use("/api/recalls", recallsRouter);

  if (existsSync(STATIC_DIR)) {
    app.use(express.static(STATIC_DIR));
    app.get("/{*splat}", (_req, res, next) => {
      if (_req.accepts("html")) {
        res.sendFile(resolve(STATIC_DIR, "index.html"));
      } else {
        next();
      }
    });
  }

  return app;
}

const app = createApp();

if (
  process.argv[1]?.endsWith("index.js") ||
  process.argv[1]?.endsWith("index.ts")
) {
  const server = app.listen(PORT, () => {
    console.log(`服务启动于端口 ${PORT}`);
  });

  function gracefulShutdown(signal: string) {
    console.log(`收到 ${signal}，正在优雅关闭...`);
    server.close(() => {
      try {
        closeDatabase();
      } catch {
        // ignore
      }
      process.exit(0);
    });
    setTimeout(() => {
      console.error("优雅关闭超时，强制退出");
      process.exit(1);
    }, 10000);
  }

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

export default app;

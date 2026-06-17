import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
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
import db from "./database.js";
import "./seed.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || "3001", 10);
const STATIC_DIR =
  process.env.STATIC_DIR || path.resolve(__dirname, "..", "dist");
const NODE_ENV = process.env.NODE_ENV || "development";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
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

  if (NODE_ENV === "production" && fs.existsSync(STATIC_DIR)) {
    app.use(express.static(STATIC_DIR));

    app.use((req, res, next) => {
      if (
        req.method !== "GET" ||
        req.path.startsWith("/api") ||
        req.path === "/health"
      ) {
        return next();
      }
      const indexPath = path.join(STATIC_DIR, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        next();
      }
    });
  }

  return app;
}

const app = createApp();

const isMainEntry = process.argv.some(
  (arg) => arg.endsWith("/index.ts") || arg.endsWith("/index.js"),
);

if (isMainEntry) {
  const server = app.listen(PORT, () => {
    console.log(`服务启动于端口 ${PORT} (${NODE_ENV})`);
    if (NODE_ENV === "production") {
      console.log(`静态资源目录: ${STATIC_DIR}`);
    }
  });

  const shutdown = (signal: string) => {
    console.log(`收到 ${signal}，正在优雅关闭...`);
    server.close(() => {
      console.log("HTTP 服务器已关闭");
      try {
        db.close();
        console.log("数据库连接已关闭");
      } catch (err) {
        console.error("关闭数据库时出错:", err);
      }
      process.exit(0);
    });

    setTimeout(() => {
      console.error("强制关闭超时，直接退出");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

export default app;

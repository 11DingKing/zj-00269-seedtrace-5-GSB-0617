import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
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

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const STATIC_DIR = process.env.STATIC_DIR;
const NODE_ENV = process.env.NODE_ENV || "development";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
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

  if (STATIC_DIR) {
    const staticPath = path.isAbsolute(STATIC_DIR)
      ? STATIC_DIR
      : path.resolve(__dirname, "..", STATIC_DIR);

    app.use(express.static(staticPath));

    app.use((req, res, next) => {
      if (req.method === "GET" && req.accepts("html")) {
        res.sendFile(path.join(staticPath, "index.html"));
      } else {
        next();
      }
    });
  }

  return app;
}

let server: http.Server | undefined;

function gracefulShutdown(signal: string) {
  console.log(`收到 ${signal} 信号，正在优雅关闭...`);

  if (server) {
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
      console.error("优雅关闭超时，强制退出");
      try {
        db.close();
      } catch {
        // ignore
      }
      process.exit(1);
    }, 10000);
  } else {
    try {
      db.close();
    } catch {
      // ignore
    }
    process.exit(0);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

function startServer() {
  const app = createApp();
  server = app.listen(PORT, () => {
    console.log(`服务启动于端口 ${PORT} (${NODE_ENV})`);
    if (STATIC_DIR) {
      const staticPath = path.isAbsolute(STATIC_DIR)
        ? STATIC_DIR
        : path.resolve(__dirname, "..", STATIC_DIR);
      console.log(`静态文件目录: ${staticPath}`);
    }
  });
  return server;
}

if (
  process.argv[1]?.endsWith("index.js") ||
  process.argv[1]?.endsWith("index.ts")
) {
  startServer();
}

export default createApp;

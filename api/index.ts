import express from "express";
import cors from "cors";
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
import "./seed.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

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

  return app;
}

const app = createApp();

if (
  process.argv[1]?.endsWith("index.js") ||
  process.argv[1]?.endsWith("index.ts")
) {
  app.listen(3001, () => {
    console.log("后端服务启动于端口 3001");
  });
}

export default app;

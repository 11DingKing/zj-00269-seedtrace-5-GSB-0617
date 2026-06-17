import type {
  SeedSource,
  SeedBatch,
  NurseryBatch,
  SeedlingBatch,
  DispatchOrder,
  PromotionSite,
  QualityInspection,
  TraceResult,
  Warning,
  DashboardStats,
  NurseryStats,
  PromotionSiteStats,
  PlantingFeedback,
  SeedSourceEffectiveness,
  Recall,
  RecallItem,
  RecallWithItems,
  RecallProgress,
} from "../../shared/types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const fetchSeedSources = () =>
  request<SeedSource[]>("/api/seed-sources");

export const createSeedSource = (data: Partial<SeedSource>) =>
  request<SeedSource>("/api/seed-sources", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const fetchSeedBatches = () => request<SeedBatch[]>("/api/seed-batches");

export const createSeedBatch = (data: Partial<SeedBatch>) =>
  request<SeedBatch>("/api/seed-batches", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const fetchSeedBatch = (id: number) =>
  request<SeedBatch>(`/api/seed-batches/${id}`);

export const fetchNurseryBatches = () =>
  request<NurseryBatch[]>("/api/nursery-batches");

export const createNurseryBatch = (data: Partial<NurseryBatch>) =>
  request<NurseryBatch>("/api/nursery-batches", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const fetchNurseryBatch = (id: number) =>
  request<NurseryBatch>(`/api/nursery-batches/${id}`);

export const fetchSeedlingBatches = () =>
  request<SeedlingBatch[]>("/api/seedling-batches");

export const createSeedlingBatch = (data: Partial<SeedlingBatch>) =>
  request<SeedlingBatch>("/api/seedling-batches", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const fetchSeedlingBatch = (id: number) =>
  request<SeedlingBatch>(`/api/seedling-batches/${id}`);

export const fetchDispatchOrders = () =>
  request<DispatchOrder[]>("/api/dispatch-orders");

export const createDispatchOrder = (data: Partial<DispatchOrder>) =>
  request<DispatchOrder>("/api/dispatch-orders", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateDispatchOrder = (id: number, data: Partial<DispatchOrder>) =>
  request<DispatchOrder>(`/api/dispatch-orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const fetchPromotionSites = () =>
  request<PromotionSite[]>("/api/promotion-sites");

export const createPromotionSite = (data: Partial<PromotionSite>) =>
  request<PromotionSite>("/api/promotion-sites", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const fetchPromotionSite = (id: number) =>
  request<PromotionSite>(`/api/promotion-sites/${id}`);

export const fetchQualityInspections = (params?: {
  batch_type?: string;
  batch_id?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.batch_type) query.set("batch_type", params.batch_type);
  if (params?.batch_id) query.set("batch_id", String(params.batch_id));
  const qs = query.toString();
  return request<QualityInspection[]>(
    `/api/quality-inspections${qs ? `?${qs}` : ""}`,
  );
};

export const createQualityInspection = (data: Partial<QualityInspection>) =>
  request<QualityInspection>("/api/quality-inspections", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const fetchTrace = (batchCode: string) =>
  request<TraceResult>(`/api/trace?batchCode=${encodeURIComponent(batchCode)}`);

export const fetchWarnings = (status?: string) => {
  const qs = status ? `?status=${status}` : "";
  return request<Warning[]>(`/api/warnings${qs}`);
};

export const createWarning = (data: Partial<Warning>) =>
  request<Warning>("/api/warnings", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const resolveWarning = (id: number) =>
  request<Warning>(`/api/warnings/${id}`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });

export const fetchImpact = (batchType: string, batchId: number) =>
  request<{
    affected_seedling_batches: SeedlingBatch[];
    affected_dispatch_orders: DispatchOrder[];
    affected_promotion_sites: PromotionSite[];
  }>(`/api/warnings/impact/${batchType}/${batchId}`);

export const fetchDashboardStats = () =>
  request<DashboardStats>("/api/statistics/dashboard");

export const fetchNurseryStats = () =>
  request<NurseryStats[]>("/api/statistics/nursery");

export const fetchPromotionSiteStats = () =>
  request<PromotionSiteStats[]>("/api/statistics/promotion-site");

export const fetchPlantingFeedbacks = (params?: {
  promotion_site_id?: number;
  seed_source_id?: number;
  seedling_batch_id?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.promotion_site_id)
    query.set("promotion_site_id", String(params.promotion_site_id));
  if (params?.seed_source_id)
    query.set("seed_source_id", String(params.seed_source_id));
  if (params?.seedling_batch_id)
    query.set("seedling_batch_id", String(params.seedling_batch_id));
  const qs = query.toString();
  return request<PlantingFeedback[]>(
    `/api/planting-feedbacks${qs ? `?${qs}` : ""}`,
  );
};

export const fetchPlantingFeedback = (id: number) =>
  request<PlantingFeedback>(`/api/planting-feedbacks/${id}`);

export const createPlantingFeedback = (data: Partial<PlantingFeedback>) =>
  request<PlantingFeedback>("/api/planting-feedbacks", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updatePlantingFeedback = (
  id: number,
  data: Partial<PlantingFeedback>,
) =>
  request<PlantingFeedback>(`/api/planting-feedbacks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deletePlantingFeedback = (id: number) =>
  request<{ message: string }>(`/api/planting-feedbacks/${id}`, {
    method: "DELETE",
  });

export const fetchSeedSourceEffectiveness = (seedSourceId?: number) => {
  const qs = seedSourceId ? `?seed_source_id=${seedSourceId}` : "";
  return request<SeedSourceEffectiveness | SeedSourceEffectiveness[]>(
    `/api/statistics/seed-source-effectiveness${qs}`,
  );
};

export const fetchRecalls = (status?: string) => {
  const qs = status ? `?status=${status}` : "";
  return request<Recall[]>(`/api/recalls${qs}`);
};

export const fetchRecall = (id: number) =>
  request<RecallWithItems>(`/api/recalls/${id}`);

export const fetchRecallProgress = (id: number) =>
  request<RecallProgress>(`/api/recalls/${id}/progress`);

export const createRecall = (data: {
  batch_type: "seed" | "nursery" | "seedling";
  batch_id: number;
  batch_code: string;
  reason?: string;
  created_by?: string;
}) =>
  request<Recall>("/api/recalls", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateRecallItem = (
  itemId: number,
  data: Partial<{
    status: string;
    disposal_method: string;
    disposal_quantity: number;
    handled_by: string;
    remark: string;
  }>,
) =>
  request<RecallItem>(`/api/recalls/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const cancelRecall = (id: number) =>
  request<Recall>(`/api/recalls/${id}/cancel`, {
    method: "PATCH",
  });

export const deleteRecall = (id: number) =>
  request<{ message: string }>(`/api/recalls/${id}`, {
    method: "DELETE",
  });

export const fetchRecallsByBatch = (batchType: string, batchId: number) =>
  request<Recall[]>(`/api/recalls/batch/${batchType}/${batchId}`);

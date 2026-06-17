export interface SeedSource {
  id: number;
  name: string;
  location: string;
  species: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface SeedBatch {
  id: number;
  batch_code: string;
  seed_source_id: number;
  quantity: number;
  unit: string;
  harvest_date: string;
  responsible_person: string;
  created_at: string;
  updated_at: string;
  seed_source?: SeedSource;
  quality_inspections?: QualityInspection[];
}

export interface NurseryBatch {
  id: number;
  batch_code: string;
  seed_batch_id: number;
  nursery_name: string;
  quantity: number;
  planting_date: string;
  responsible_person: string;
  created_at: string;
  updated_at: string;
  seed_batch?: SeedBatch;
  quality_inspections?: QualityInspection[];
}

export interface SeedlingBatch {
  id: number;
  batch_code: string;
  nursery_batch_id: number;
  quantity: number;
  out_date: string;
  responsible_person: string;
  created_at: string;
  updated_at: string;
  nursery_batch?: NurseryBatch;
  quality_inspections?: QualityInspection[];
}

export interface DispatchOrder {
  id: number;
  order_code: string;
  seedling_batch_id: number;
  promotion_site_id: number;
  quantity: number;
  dispatch_date: string;
  status: "pending" | "delivered" | "received";
  created_at: string;
  updated_at: string;
  seedling_batch?: SeedlingBatch;
  promotion_site?: PromotionSite;
}

export interface PromotionSite {
  id: number;
  name: string;
  address: string;
  responsible_person: string;
  contact_phone: string;
  created_at: string;
  updated_at: string;
}

export interface QualityInspection {
  id: number;
  batch_type: "seed" | "nursery" | "seedling";
  batch_id: number;
  result: "qualified" | "unqualified";
  items: string;
  values: string;
  inspector: string;
  inspect_date: string;
  created_at: string;
}

export interface Warning {
  id: number;
  batch_type: string;
  batch_id: number;
  batch_code: string;
  reason: string;
  affected_seedling_batches: string;
  affected_dispatch_orders: string;
  affected_promotion_sites: string;
  status: "active" | "resolved";
  created_at: string;
  resolved_at: string | null;
}

export interface TraceResult {
  seed_source: SeedSource;
  seed_batch: SeedBatch;
  nursery_batch: NurseryBatch;
  seedling_batch: SeedlingBatch;
  dispatch_orders: DispatchOrder[];
  promotion_sites: PromotionSite[];
}

export interface DashboardStats {
  seed_source_count: number;
  seed_batch_count: number;
  nursery_batch_count: number;
  seedling_batch_count: number;
  dispatch_order_count: number;
  promotion_site_count: number;
  active_warning_count: number;
}

export interface NurseryStats {
  nursery_name: string;
  nursery_quantity: number;
  seedling_quantity: number;
  problem_count: number;
}

export interface PlantingFeedback {
  id: number;
  dispatch_order_id: number;
  promotion_site_id: number;
  seedling_batch_id: number;
  nursery_batch_id: number;
  seed_batch_id: number;
  seed_source_id: number;
  plot_location: string;
  plot_area: number;
  planted_quantity: number;
  survival_rate: number;
  growth_status: "excellent" | "good" | "normal" | "poor" | "dead";
  feedback_date: string;
  remark: string;
  created_at: string;
  updated_at: string;
  promotion_site?: PromotionSite;
  dispatch_order?: DispatchOrder;
  seedling_batch?: SeedlingBatch;
  nursery_batch?: NurseryBatch;
  seed_batch?: SeedBatch;
  seed_source?: SeedSource;
}

export interface SeedSourceEffectiveness {
  seed_source_id: number;
  seed_source_name: string;
  species: string;
  total_plot_area: number;
  total_planted_quantity: number;
  avg_survival_rate: number;
  feedback_count: number;
  promotion_site_count: number;
  growth_distribution: {
    excellent: number;
    good: number;
    normal: number;
    poor: number;
    dead: number;
  };
  site_details: {
    promotion_site_id: number;
    promotion_site_name: string;
    plot_area: number;
    planted_quantity: number;
    avg_survival_rate: number;
    feedback_count: number;
    latest_feedback_date: string;
    seedling_batch_codes: string[];
  }[];
}

export interface PromotionSiteStats {
  site_name: string;
  received_quantity: number;
  source_nurseries: string[];
  affected_count: number;
}

export type RecallStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";
export type RecallItemStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "cancelled";
export type DisposalMethod = "return" | "destroy" | "quarantine" | "other";

export interface Recall {
  id: number;
  recall_code: string;
  batch_type: "seed" | "nursery" | "seedling";
  batch_id: number;
  batch_code: string;
  reason: string;
  status: RecallStatus;
  affected_seedling_batches: number[];
  affected_dispatch_orders: number[];
  affected_promotion_sites: number[];
  created_by: string;
  created_at: string;
  completed_at: string | null;
  total_items: number;
  completed_items: number;
  seed_batch?: SeedBatch;
  nursery_batch?: NurseryBatch;
  seedling_batch?: SeedlingBatch;
}

export interface RecallItem {
  id: number;
  recall_id: number;
  item_type: "seedling_batch" | "dispatch_order" | "promotion_site";
  item_id: number;
  item_code: string;
  item_name: string;
  status: RecallItemStatus;
  disposal_method: DisposalMethod | null;
  disposal_quantity: number;
  handled_by: string | null;
  handled_at: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
  seedling_batch?: SeedlingBatch;
  dispatch_order?: DispatchOrder;
  promotion_site?: PromotionSite;
}

export interface RecallWithItems extends Recall {
  items: RecallItem[];
  seedling_batches: SeedlingBatch[];
  dispatch_orders: DispatchOrder[];
  promotion_sites: PromotionSite[];
}

export interface RecallProgress {
  total: number;
  not_started: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  percentage: number;
}

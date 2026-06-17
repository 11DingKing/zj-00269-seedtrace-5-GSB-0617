import { useState } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { fetchTrace, fetchQualityInspections } from "@/api/client";
import type {
  TraceResult,
  QualityInspection,
  DispatchOrder,
  PromotionSite,
} from "@shared/types";

interface TraceNode {
  emoji: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  data: {
    code: string;
    quantity?: number | string;
    date?: string;
    person?: string;
    extra?: string;
  };
  hasWarning?: boolean;
}

export default function Trace() {
  const [batchCode, setBatchCode] = useState("");
  const [result, setResult] = useState<TraceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inspections, setInspections] = useState<
    Record<string, QualityInspection[]>
  >({});

  const handleSearch = async () => {
    if (!batchCode.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await fetchTrace(batchCode.trim());
      setResult(data);
      const allInspections: Record<string, QualityInspection[]> = {};
      if (data.seed_batch) {
        const seedInsps = await fetchQualityInspections({
          batch_type: "seed",
          batch_id: data.seed_batch.id,
        });
        if (seedInsps.length > 0) allInspections["seed"] = seedInsps;
      }
      if (data.nursery_batch) {
        const nurseryInsps = await fetchQualityInspections({
          batch_type: "nursery",
          batch_id: data.nursery_batch.id,
        });
        if (nurseryInsps.length > 0) allInspections["nursery"] = nurseryInsps;
      }
      if (data.seedling_batch) {
        const seedlingInsps = await fetchQualityInspections({
          batch_type: "seedling",
          batch_id: data.seedling_batch.id,
        });
        if (seedlingInsps.length > 0)
          allInspections["seedling"] = seedlingInsps;
      }
      setInspections(allInspections);
    } catch (err: any) {
      setError(err.message || "查询失败");
    } finally {
      setLoading(false);
    }
  };

  const hasUnqualified = (type: string) => {
    return (inspections[type] || []).some((i) => i.result === "unqualified");
  };

  const buildNodes = (): TraceNode[] => {
    if (!result) return [];
    const nodes: TraceNode[] = [];

    nodes.push({
      emoji: "🌲",
      label: "种源",
      color: "text-forest-700",
      bgColor: "bg-forest-100",
      borderColor: "border-forest-500",
      data: {
        code: result.seed_source.name,
        extra: `${result.seed_source.location} | ${result.seed_source.species}`,
      },
    });

    if (result.seed_batch) {
      nodes.push({
        emoji: "🌰",
        label: "种子批次",
        color: "text-bark-700",
        bgColor: "bg-bark-100",
        borderColor: "border-bark-500",
        data: {
          code: result.seed_batch.batch_code,
          quantity: `${result.seed_batch.quantity} ${result.seed_batch.unit}`,
          date: result.seed_batch.harvest_date,
          person: result.seed_batch.responsible_person,
        },
        hasWarning: hasUnqualified("seed"),
      });
    }

    if (result.nursery_batch) {
      nodes.push({
        emoji: "🌱",
        label: "育苗批次",
        color: "text-forest-600",
        bgColor: "bg-forest-50",
        borderColor: "border-forest-400",
        data: {
          code: result.nursery_batch.batch_code,
          quantity: result.nursery_batch.quantity,
          date: result.nursery_batch.planting_date,
          person: result.nursery_batch.responsible_person,
          extra: result.nursery_batch.nursery_name,
        },
        hasWarning: hasUnqualified("nursery"),
      });
    }

    if (result.seedling_batch) {
      nodes.push({
        emoji: "🌳",
        label: "出圃批次",
        color: "text-forest-800",
        bgColor: "bg-forest-200",
        borderColor: "border-forest-600",
        data: {
          code: result.seedling_batch.batch_code,
          quantity: result.seedling_batch.quantity,
          date: result.seedling_batch.out_date,
          person: result.seedling_batch.responsible_person,
        },
        hasWarning: hasUnqualified("seedling"),
      });
    }

    if (result.dispatch_orders && result.dispatch_orders.length > 0) {
      result.dispatch_orders.forEach((order: DispatchOrder) => {
        nodes.push({
          emoji: "🚛",
          label: "调运单",
          color: "text-blue-700",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-400",
          data: {
            code: order.order_code,
            quantity: order.quantity,
            date: order.dispatch_date,
            extra: `状态: ${order.status === "pending" ? "待发运" : order.status === "delivered" ? "已发运" : "已收苗"}`,
          },
        });
      });
    }

    if (result.promotion_sites && result.promotion_sites.length > 0) {
      result.promotion_sites.forEach((site: PromotionSite) => {
        nodes.push({
          emoji: "📍",
          label: "推广点",
          color: "text-red-700",
          bgColor: "bg-red-50",
          borderColor: "border-red-400",
          data: {
            code: site.name,
            extra: site.address,
            person: site.responsible_person,
          },
        });
      });
    }

    return nodes;
  };

  const nodes = buildNodes();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-bold">溯源查询</h2>

      <div className="card">
        <div className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="输入批次号查询溯源信息..."
            value={batchCode}
            onChange={(e) => setBatchCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            className="btn-primary flex items-center gap-2"
            onClick={handleSearch}
            disabled={loading}
          >
            <Search size={16} />
            {loading ? "查询中..." : "查询"}
          </button>
        </div>
      </div>

      {error && (
        <div className="card border-l-4 border-l-red-500 bg-red-50">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {nodes.length > 0 && (
        <div className="card">
          <div className="relative pl-8">
            {nodes.map((node, idx) => (
              <div key={idx} className="relative pb-8 last:pb-0">
                {idx < nodes.length - 1 && (
                  <div className="absolute left-[15px] top-[40px] bottom-0 w-0.5 bg-forest-200" />
                )}
                <div className="flex items-start gap-4">
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full ${node.bgColor} border-2 ${node.borderColor} flex items-center justify-center text-sm flex-shrink-0 -ml-8`}
                  >
                    {node.emoji}
                  </div>
                  <div
                    className={`flex-1 rounded-lg border ${node.borderColor} ${node.bgColor} p-4`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-bold ${node.color}`}>
                        {node.label}
                      </span>
                      {node.hasWarning && (
                        <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                          <AlertTriangle size={12} /> 质检不合格
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">{node.data.code}</div>
                      {node.data.extra && (
                        <div className="text-forest-600">{node.data.extra}</div>
                      )}
                      <div className="flex gap-4 text-forest-600">
                        {node.data.quantity !== undefined && (
                          <span>数量: {node.data.quantity}</span>
                        )}
                        {node.data.date && <span>日期: {node.data.date}</span>}
                        {node.data.person && (
                          <span>责任人: {node.data.person}</span>
                        )}
                      </div>
                    </div>
                    {inspections[
                      idx === 1
                        ? "seed"
                        : idx === 2
                          ? "nursery"
                          : idx === 3
                            ? "seedling"
                            : ""
                    ] && (
                      <div className="mt-3 pt-2 border-t border-forest-200/50">
                        <div className="text-xs font-medium text-forest-700 mb-1">
                          质检记录
                        </div>
                        {(
                          inspections[
                            idx === 1
                              ? "seed"
                              : idx === 2
                                ? "nursery"
                                : idx === 3
                                  ? "seedling"
                                  : ""
                          ] || []
                        ).map((insp) => (
                          <div
                            key={insp.id}
                            className="flex items-center gap-2 text-xs"
                          >
                            <span
                              className={`px-1.5 py-0.5 rounded ${insp.result === "qualified" ? "bg-forest-200 text-forest-800" : "bg-red-200 text-red-800"}`}
                            >
                              {insp.result === "qualified" ? "合格" : "不合格"}
                            </span>
                            <span>
                              {insp.inspector} | {insp.inspect_date}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

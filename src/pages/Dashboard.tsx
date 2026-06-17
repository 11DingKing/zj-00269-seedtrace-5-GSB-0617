import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TreePine,
  Package,
  Sprout,
  TreeDeciduous,
  Truck,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { fetchDashboardStats, fetchWarnings } from "@/api/client";
import type { DashboardStats, Warning } from "@shared/types";

const statCards = [
  {
    key: "seed_source_count" as const,
    label: "种源数",
    icon: TreePine,
    color: "border-forest-600",
  },
  {
    key: "seed_batch_count" as const,
    label: "种子批次",
    icon: Package,
    color: "border-bark-500",
  },
  {
    key: "nursery_batch_count" as const,
    label: "育苗批次",
    icon: Sprout,
    color: "border-forest-400",
  },
  {
    key: "seedling_batch_count" as const,
    label: "出圃批次",
    icon: TreeDeciduous,
    color: "border-forest-700",
  },
  {
    key: "dispatch_order_count" as const,
    label: "调运单",
    icon: Truck,
    color: "border-blue-500",
  },
  {
    key: "promotion_site_count" as const,
    label: "推广点",
    icon: MapPin,
    color: "border-red-500",
  },
  {
    key: "active_warning_count" as const,
    label: "活跃预警",
    icon: AlertTriangle,
    color: "border-amber-500",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [warnings, setWarnings] = useState<Warning[]>([]);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch(() => {});
    fetchWarnings("active")
      .then(setWarnings)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-bold">仪表盘</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {statCards.map((card) => (
          <div
            key={card.key}
            className={`card border-l-4 ${card.color} flex flex-col items-center gap-2`}
          >
            <card.icon size={28} className="text-forest-700" />
            <span className="text-2xl font-bold">
              {stats?.[card.key] ?? "-"}
            </span>
            <span className="text-sm text-forest-600">{card.label}</span>
          </div>
        ))}
      </div>

      <div className="card border-l-4 border-l-red-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-serif font-bold flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            最新预警
          </h3>
          <button
            className="btn-secondary text-sm"
            onClick={() => navigate("/warnings")}
          >
            查看全部
          </button>
        </div>
        {warnings.length === 0 ? (
          <p className="text-forest-500">暂无活跃预警</p>
        ) : (
          <div className="space-y-2">
            {warnings.slice(0, 5).map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
              >
                <div>
                  <span className="font-medium text-red-800">
                    {w.batch_code}
                  </span>
                  <span className="text-sm text-red-600 ml-2">{w.reason}</span>
                </div>
                <span className="text-xs text-red-500">{w.created_at}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          className="btn-primary"
          onClick={() => navigate("/seed-batches")}
        >
          录入种子批次
        </button>
        <button className="btn-primary" onClick={() => navigate("/trace")}>
          溯源查询
        </button>
        <button className="btn-primary" onClick={() => navigate("/warnings")}>
          预警中心
        </button>
        <button className="btn-primary" onClick={() => navigate("/statistics")}>
          统计报表
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  fetchDashboardStats,
  fetchNurseryStats,
  fetchPromotionSiteStats,
} from "@/api/client";
import type {
  DashboardStats,
  NurseryStats,
  PromotionSiteStats,
} from "@shared/types";

const COLORS = [
  "#1B4332",
  "#8B6914",
  "#22c55e",
  "#166534",
  "#4ade80",
  "#86efac",
  "#bbf7d0",
];

type TabKey = "nursery" | "site" | "dashboard";

export default function Statistics() {
  const [tab, setTab] = useState<TabKey>("nursery");
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [nursery, setNursery] = useState<NurseryStats[]>([]);
  const [sites, setSites] = useState<PromotionSiteStats[]>([]);

  useEffect(() => {
    fetchDashboardStats()
      .then(setDashboard)
      .catch(() => {});
    fetchNurseryStats()
      .then(setNursery)
      .catch(() => {});
    fetchPromotionSiteStats()
      .then(setSites)
      .catch(() => {});
  }, []);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "nursery", label: "按苗圃统计" },
    { key: "site", label: "按推广点统计" },
    { key: "dashboard", label: "仪表盘概览" },
  ];

  const pieData = dashboard
    ? [
        { name: "种源", value: dashboard.seed_source_count },
        { name: "种子批次", value: dashboard.seed_batch_count },
        { name: "育苗批次", value: dashboard.nursery_batch_count },
        { name: "出圃批次", value: dashboard.seedling_batch_count },
        { name: "调运单", value: dashboard.dispatch_order_count },
        { name: "推广点", value: dashboard.promotion_site_count },
      ]
    : [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-bold">统计报表</h2>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-forest-950 text-white"
                : "bg-white text-forest-700 border border-forest-200 hover:bg-forest-50"
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "nursery" && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-serif font-bold mb-4">
              苗圃育苗量统计
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={nursery}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nursery_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="nursery_quantity"
                  fill="#1B4332"
                  name="育苗数量"
                />
                <Bar
                  dataKey="seedling_quantity"
                  fill="#22c55e"
                  name="出圃数量"
                />
                <Bar dataKey="problem_count" fill="#ef4444" name="问题数" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left p-3">苗圃名称</th>
                  <th className="text-left p-3">育苗数量</th>
                  <th className="text-left p-3">出圃数量</th>
                  <th className="text-left p-3">问题数</th>
                </tr>
              </thead>
              <tbody>
                {nursery.map((n, i) => (
                  <tr key={i} className="border-t border-forest-50">
                    <td className="p-3 font-medium">{n.nursery_name}</td>
                    <td className="p-3">{n.nursery_quantity}</td>
                    <td className="p-3">{n.seedling_quantity}</td>
                    <td className="p-3">
                      <span
                        className={
                          n.problem_count > 0 ? "text-red-600 font-medium" : ""
                        }
                      >
                        {n.problem_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "site" && (
        <div className="card overflow-x-auto">
          <h3 className="text-lg font-serif font-bold mb-4">推广点统计</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left p-3">推广点</th>
                <th className="text-left p-3">已收数量</th>
                <th className="text-left p-3">来源苗圃</th>
                <th className="text-left p-3">受影响预警数</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((s, i) => (
                <tr key={i} className="border-t border-forest-50">
                  <td className="p-3 font-medium">{s.site_name}</td>
                  <td className="p-3">{s.received_quantity}</td>
                  <td className="p-3">
                    {s.source_nurseries.join(", ") || "-"}
                  </td>
                  <td className="p-3">
                    <span
                      className={
                        s.affected_count > 0 ? "text-red-600 font-medium" : ""
                      }
                    >
                      {s.affected_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "dashboard" && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-serif font-bold mb-4">批次分布</h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={120}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {dashboard && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card text-center">
                <div className="text-2xl font-bold text-forest-950">
                  {dashboard.seed_source_count}
                </div>
                <div className="text-sm text-forest-600">种源数</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-forest-950">
                  {dashboard.seed_batch_count}
                </div>
                <div className="text-sm text-forest-600">种子批次</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-forest-950">
                  {dashboard.nursery_batch_count}
                </div>
                <div className="text-sm text-forest-600">育苗批次</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-forest-950">
                  {dashboard.seedling_batch_count}
                </div>
                <div className="text-sm text-forest-600">出圃批次</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-forest-950">
                  {dashboard.dispatch_order_count}
                </div>
                <div className="text-sm text-forest-600">调运单</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-forest-950">
                  {dashboard.promotion_site_count}
                </div>
                <div className="text-sm text-forest-600">推广点</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-red-600">
                  {dashboard.active_warning_count}
                </div>
                <div className="text-sm text-forest-600">活跃预警</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

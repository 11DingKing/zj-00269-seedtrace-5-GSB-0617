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
import { fetchSeedSourceEffectiveness, fetchSeedSources } from "@/api/client";
import type { SeedSource, SeedSourceEffectiveness } from "@shared/types";

const GROWTH_COLORS = {
  excellent: "#10b981",
  good: "#22c55e",
  normal: "#f59e0b",
  poor: "#f97316",
  dead: "#ef4444",
};

const GROWTH_LABELS = {
  excellent: "优秀",
  good: "良好",
  normal: "一般",
  poor: "较差",
  dead: "死亡",
};

export default function Effectiveness() {
  const [seedSources, setSeedSources] = useState<SeedSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<number | "">("");
  const [effectivenessData, setEffectivenessData] = useState<
    SeedSourceEffectiveness[]
  >([]);
  const [selectedDetail, setSelectedDetail] =
    useState<SeedSourceEffectiveness | null>(null);

  const loadSeedSources = () => {
    fetchSeedSources()
      .then(setSeedSources)
      .catch(() => {});
  };

  const loadEffectiveness = () => {
    if (selectedSource) {
      fetchSeedSourceEffectiveness(Number(selectedSource))
        .then((data) => {
          setSelectedDetail(data as SeedSourceEffectiveness);
          setEffectivenessData([data as SeedSourceEffectiveness]);
        })
        .catch(() => {});
    } else {
      fetchSeedSourceEffectiveness()
        .then((data) => {
          setEffectivenessData(data as SeedSourceEffectiveness[]);
          setSelectedDetail(null);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    loadSeedSources();
  }, []);

  useEffect(() => {
    loadEffectiveness();
  }, [selectedSource]);

  const getGrowthPieData = (item: SeedSourceEffectiveness) => {
    return Object.entries(item.growth_distribution).map(([key, value]) => ({
      name: GROWTH_LABELS[key as keyof typeof GROWTH_LABELS],
      value,
      color: GROWTH_COLORS[key as keyof typeof GROWTH_COLORS],
    }));
  };

  const getSiteBarData = (item: SeedSourceEffectiveness) => {
    return item.site_details.map(
      (site: SeedSourceEffectiveness["site_details"][0]) => ({
        name: site.promotion_site_name,
        种植数量: site.planted_quantity,
        成活率: site.avg_survival_rate,
      }),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-bold">种源成效汇总</h2>
        <div className="flex items-center gap-2">
          <label className="label mb-0">种源筛选：</label>
          <select
            className="input w-56"
            value={selectedSource}
            onChange={(e) =>
              setSelectedSource(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">全部种源</option>
            {seedSources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} - {s.species}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedDetail && effectivenessData.length > 0 && (
        <div className="card overflow-x-auto">
          <h3 className="text-lg font-serif font-bold mb-4">种源成效一览</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left p-3">种源名称</th>
                <th className="text-left p-3">树种</th>
                <th className="text-left p-3">造林总面积(亩)</th>
                <th className="text-left p-3">总种植数(株)</th>
                <th className="text-left p-3">平均成活率</th>
                <th className="text-left p-3">反馈数</th>
                <th className="text-left p-3">推广点数</th>
                <th className="text-left p-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {effectivenessData.map((item) => (
                <tr
                  key={item.seed_source_id}
                  className="border-t border-forest-50 hover:bg-forest-50/50"
                >
                  <td className="p-3 font-medium">{item.seed_source_name}</td>
                  <td className="p-3">{item.species}</td>
                  <td className="p-3">{item.total_plot_area}</td>
                  <td className="p-3">{item.total_planted_quantity}</td>
                  <td className="p-3">{item.avg_survival_rate.toFixed(1)}%</td>
                  <td className="p-3">{item.feedback_count}</td>
                  <td className="p-3">{item.promotion_site_count}</td>
                  <td className="p-3">
                    <button
                      className="text-forest-600 hover:text-forest-900 text-sm font-medium"
                      onClick={() => setSelectedSource(item.seed_source_id)}
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedDetail && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-serif font-bold">
                  {selectedDetail.seed_source_name}
                </h3>
                <p className="text-sm text-forest-600">
                  树种：{selectedDetail.species}
                </p>
              </div>
              <button
                className="btn-secondary text-sm"
                onClick={() => setSelectedSource("")}
              >
                返回列表
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-forest-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-forest-950">
                  {selectedDetail.total_plot_area}
                </div>
                <div className="text-sm text-forest-600">造林总面积(亩)</div>
              </div>
              <div className="bg-forest-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-forest-950">
                  {selectedDetail.total_planted_quantity}
                </div>
                <div className="text-sm text-forest-600">总种植数(株)</div>
              </div>
              <div className="bg-forest-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {selectedDetail.avg_survival_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-forest-600">平均成活率</div>
              </div>
              <div className="bg-forest-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-forest-950">
                  {selectedDetail.promotion_site_count}
                </div>
                <div className="text-sm text-forest-600">推广点数</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-serif font-bold mb-4">长势分布</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={getGrowthPieData(selectedDetail)}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {getGrowthPieData(selectedDetail).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="text-lg font-serif font-bold mb-4">
                各推广点造林数量
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={getSiteBarData(selectedDetail)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="种植数量"
                    fill="#1B4332"
                    name="种植数量(株)"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="成活率"
                    fill="#22c55e"
                    name="成活率(%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card overflow-x-auto">
            <h3 className="text-lg font-serif font-bold mb-4">
              各推广点详细数据
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left p-3">推广点</th>
                  <th className="text-left p-3">造林面积(亩)</th>
                  <th className="text-left p-3">种植数量(株)</th>
                  <th className="text-left p-3">平均成活率</th>
                  <th className="text-left p-3">反馈次数</th>
                  <th className="text-left p-3">最新反馈</th>
                  <th className="text-left p-3">涉及出圃批次</th>
                </tr>
              </thead>
              <tbody>
                {selectedDetail.site_details.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-forest-500">
                      暂无推广点成效数据
                    </td>
                  </tr>
                ) : (
                  selectedDetail.site_details.map(
                    (site: SeedSourceEffectiveness["site_details"][0]) => (
                      <tr
                        key={site.promotion_site_id}
                        className="border-t border-forest-50 hover:bg-forest-50/50"
                      >
                        <td className="p-3 font-medium">
                          {site.promotion_site_name}
                        </td>
                        <td className="p-3">{site.plot_area}</td>
                        <td className="p-3">{site.planted_quantity}</td>
                        <td className="p-3">
                          {site.avg_survival_rate.toFixed(1)}%
                        </td>
                        <td className="p-3">{site.feedback_count}</td>
                        <td className="p-3">
                          {site.latest_feedback_date || "-"}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {site.seedling_batch_codes.map((code: string) => (
                              <span
                                key={code}
                                className="px-2 py-0.5 bg-forest-100 text-forest-700 rounded text-xs"
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

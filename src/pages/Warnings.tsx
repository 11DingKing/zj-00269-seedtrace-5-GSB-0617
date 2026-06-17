import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Plus } from "lucide-react";
import {
  fetchWarnings,
  resolveWarning,
  createWarning,
  fetchImpact,
} from "@/api/client";
import type {
  Warning,
  SeedlingBatch,
  DispatchOrder,
  PromotionSite,
} from "@shared/types";

type FilterTab = "all" | "active" | "resolved";

const batchTypeMap: Record<string, string> = {
  seed: "种子批次",
  nursery: "育苗批次",
  seedling: "苗木批次",
};

export default function Warnings() {
  const [list, setList] = useState<Warning[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [impactData, setImpactData] = useState<{
    affected_seedling_batches: SeedlingBatch[];
    affected_dispatch_orders: DispatchOrder[];
    affected_promotion_sites: PromotionSite[];
  } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    batch_type: "seed",
    batch_id: 0,
    batch_code: "",
    reason: "",
  });

  const load = () => {
    const status = filter === "all" ? undefined : filter;
    fetchWarnings(status)
      .then(setList)
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [filter]);

  const handleResolve = async (id: number) => {
    await resolveWarning(id);
    load();
  };

  const toggleExpand = async (w: Warning) => {
    if (expandedId === w.id) {
      setExpandedId(null);
      setImpactData(null);
      return;
    }
    setExpandedId(w.id);
    try {
      const data = await fetchImpact(w.batch_type, w.batch_id);
      setImpactData(data);
    } catch {
      setImpactData(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createWarning(form);
    setForm({ batch_type: "seed", batch_id: 0, batch_code: "", reason: "" });
    setShowForm(false);
    load();
  };

  const parseIds = (str: string): number[] => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "全部" },
    { key: "active", label: "未处理" },
    { key: "resolved", label: "已处理" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-bold">预警中心</h2>
        <button
          className="btn-primary flex items-center gap-1"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} /> 创建预警
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">批次类型</label>
              <select
                className="input"
                value={form.batch_type}
                onChange={(e) =>
                  setForm({ ...form, batch_type: e.target.value })
                }
              >
                <option value="seed">种子批次</option>
                <option value="nursery">育苗批次</option>
                <option value="seedling">苗木批次</option>
              </select>
            </div>
            <div>
              <label className="label">批次ID</label>
              <input
                type="number"
                className="input"
                value={form.batch_id || ""}
                onChange={(e) =>
                  setForm({ ...form, batch_id: Number(e.target.value) })
                }
                required
              />
            </div>
            <div>
              <label className="label">批次号</label>
              <input
                className="input"
                value={form.batch_code}
                onChange={(e) =>
                  setForm({ ...form, batch_code: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">原因</label>
              <input
                className="input"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                required
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="btn-primary">
                提交
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-forest-950 text-white"
                : "bg-white text-forest-700 border border-forest-200 hover:bg-forest-50"
            }`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="text-left p-3"></th>
              <th className="text-left p-3">预警ID</th>
              <th className="text-left p-3">批次类型</th>
              <th className="text-left p-3">批次号</th>
              <th className="text-left p-3">原因</th>
              <th className="text-left p-3">受影响出圃</th>
              <th className="text-left p-3">受影响调运</th>
              <th className="text-left p-3">受影响推广点</th>
              <th className="text-left p-3">状态</th>
              <th className="text-left p-3">创建时间</th>
              <th className="text-left p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((w) => (
              <>
                <tr
                  key={w.id}
                  className="border-t border-forest-50 hover:bg-forest-50/50"
                >
                  <td className="p-3">
                    <button onClick={() => toggleExpand(w)}>
                      {expandedId === w.id ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </td>
                  <td className="p-3">{w.id}</td>
                  <td className="p-3">
                    {batchTypeMap[w.batch_type] || w.batch_type}
                  </td>
                  <td className="p-3 font-medium">{w.batch_code}</td>
                  <td className="p-3 max-w-xs truncate">{w.reason}</td>
                  <td className="p-3">
                    {parseIds(w.affected_seedling_batches).length}
                  </td>
                  <td className="p-3">
                    {parseIds(w.affected_dispatch_orders).length}
                  </td>
                  <td className="p-3">
                    {parseIds(w.affected_promotion_sites).length}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        w.status === "active"
                          ? "bg-red-100 text-red-700"
                          : "bg-forest-100 text-forest-700"
                      }`}
                    >
                      {w.status === "active" ? "未处理" : "已处理"}
                    </span>
                  </td>
                  <td className="p-3">{w.created_at}</td>
                  <td className="p-3">
                    {w.status === "active" && (
                      <button
                        className="btn-primary text-xs"
                        onClick={() => handleResolve(w.id)}
                      >
                        处理预警
                      </button>
                    )}
                  </td>
                </tr>
                {expandedId === w.id && (
                  <tr key={`${w.id}-detail`}>
                    <td colSpan={11} className="p-3 bg-forest-50/30">
                      <div className="space-y-3">
                        <h4 className="font-medium text-forest-800 flex items-center gap-2">
                          <AlertTriangle size={16} className="text-amber-500" />
                          受影响详情
                        </h4>
                        {impactData ? (
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <h5 className="text-sm font-medium text-forest-700 mb-2">
                                受影响出圃批次
                              </h5>
                              {impactData.affected_seedling_batches.length ===
                              0 ? (
                                <p className="text-xs text-forest-500">无</p>
                              ) : (
                                impactData.affected_seedling_batches.map(
                                  (b) => (
                                    <div
                                      key={b.id}
                                      className="text-xs p-1.5 bg-white rounded border border-forest-100 mb-1"
                                    >
                                      {b.batch_code} ({b.quantity})
                                    </div>
                                  ),
                                )
                              )}
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-forest-700 mb-2">
                                受影响调运单
                              </h5>
                              {impactData.affected_dispatch_orders.length ===
                              0 ? (
                                <p className="text-xs text-forest-500">无</p>
                              ) : (
                                impactData.affected_dispatch_orders.map((o) => (
                                  <div
                                    key={o.id}
                                    className="text-xs p-1.5 bg-white rounded border border-forest-100 mb-1"
                                  >
                                    {o.order_code}
                                  </div>
                                ))
                              )}
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-forest-700 mb-2">
                                受影响推广点
                              </h5>
                              {impactData.affected_promotion_sites.length ===
                              0 ? (
                                <p className="text-xs text-forest-500">无</p>
                              ) : (
                                impactData.affected_promotion_sites.map((s) => (
                                  <div
                                    key={s.id}
                                    className="text-xs p-1.5 bg-white rounded border border-forest-100 mb-1"
                                  >
                                    {s.name}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-forest-500">加载中...</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

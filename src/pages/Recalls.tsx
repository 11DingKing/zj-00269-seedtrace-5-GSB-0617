import { useEffect, useState } from "react";
import { Plus, Eye, XCircle, Trash2, AlertCircle, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  fetchRecalls,
  createRecall,
  cancelRecall,
  deleteRecall,
  fetchImpact,
} from "@/api/client";
import type {
  Recall,
  SeedlingBatch,
  DispatchOrder,
  PromotionSite,
} from "@shared/types";

type FilterTab = "all" | "pending" | "in_progress" | "completed" | "cancelled";

const batchTypeMap: Record<string, string> = {
  seed: "种子批次",
  nursery: "育苗批次",
  seedling: "出圃批次",
};

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: "待处理", className: "bg-amber-100 text-amber-700" },
  in_progress: {
    label: "进行中",
    className: "bg-blue-100 text-blue-700",
  },
  completed: {
    label: "已完成",
    className: "bg-forest-100 text-forest-700",
  },
  cancelled: { label: "已取消", className: "bg-gray-100 text-gray-700" },
};

export default function Recalls() {
  const navigate = useNavigate();
  const [list, setList] = useState<Recall[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    batch_type: "seed" as "seed" | "nursery" | "seedling",
    batch_id: 0,
    batch_code: "",
    reason: "",
    created_by: "",
  });
  const [previewImpact, setPreviewImpact] = useState<{
    affected_seedling_batches: SeedlingBatch[];
    affected_dispatch_orders: DispatchOrder[];
    affected_promotion_sites: PromotionSite[];
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    const status = filter === "all" ? undefined : filter;
    fetchRecalls(status)
      .then(setList)
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [filter]);

  const handlePreview = async () => {
    if (!form.batch_type || !form.batch_id) return;
    setPreviewLoading(true);
    setPreviewImpact(null);
    try {
      const data = await fetchImpact(form.batch_type, form.batch_id);
      setPreviewImpact(data);
    } catch (err: any) {
      alert(err.message || "预览影响范围失败");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batch_code.trim()) {
      alert("请输入批次号");
      return;
    }
    const totalItems =
      (previewImpact?.affected_seedling_batches.length || 0) +
      (previewImpact?.affected_dispatch_orders.length || 0) +
      (previewImpact?.affected_promotion_sites.length || 0);
    if (totalItems === 0) {
      alert("该批次没有可追溯的下游节点，无需召回");
      return;
    }
    setSubmitting(true);
    try {
      await createRecall(form);
      setForm({
        batch_type: "seed",
        batch_id: 0,
        batch_code: "",
        reason: "",
        created_by: "",
      });
      setPreviewImpact(null);
      setShowForm(false);
      load();
    } catch (err: any) {
      alert(err.message || "发起召回失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("确定要取消该召回吗？未开始的召回项将被标记为已取消。")) return;
    await cancelRecall(id);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除该召回记录吗？此操作不可恢复。")) return;
    await deleteRecall(id);
    load();
  };

  const getProgressPercentage = (recall: Recall) => {
    if (recall.total_items === 0) return 0;
    return Math.round((recall.completed_items / recall.total_items) * 100);
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "全部" },
    { key: "pending", label: "待处理" },
    { key: "in_progress", label: "进行中" },
    { key: "completed", label: "已完成" },
    { key: "cancelled", label: "已取消" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-bold">召回管理</h2>
        <button
          className="btn-primary flex items-center gap-1"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} /> 发起召回
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <RotateCcw size={18} className="text-red-600" />
            发起新召回
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">批次类型</label>
                <select
                  className="input"
                  value={form.batch_type}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      batch_type: e.target.value as
                        | "seed"
                        | "nursery"
                        | "seedling",
                      batch_id: 0,
                      batch_code: "",
                    });
                    setPreviewImpact(null);
                  }}
                >
                  <option value="seed">种子批次</option>
                  <option value="nursery">育苗批次</option>
                  <option value="seedling">出圃批次</option>
                </select>
              </div>
              <div>
                <label className="label">批次ID</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="input flex-1"
                    value={form.batch_id || ""}
                    onChange={(e) => {
                      setForm({ ...form, batch_id: Number(e.target.value) });
                      setPreviewImpact(null);
                    }}
                    placeholder="输入批次ID"
                    required
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handlePreview}
                    disabled={!form.batch_id || previewLoading}
                  >
                    {previewLoading ? "加载中..." : "预览影响"}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">批次号</label>
                <input
                  className="input"
                  value={form.batch_code}
                  onChange={(e) =>
                    setForm({ ...form, batch_code: e.target.value })
                  }
                  placeholder="如：BATCH-2024-001"
                  required
                />
              </div>
              <div>
                <label className="label">发起人</label>
                <input
                  className="input"
                  value={form.created_by}
                  onChange={(e) =>
                    setForm({ ...form, created_by: e.target.value })
                  }
                  placeholder="默认为系统管理员"
                />
              </div>
              <div className="col-span-2">
                <label className="label">召回原因</label>
                <textarea
                  className="input min-h-[80px]"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="请详细描述召回原因..."
                  required
                />
              </div>
            </div>

            {previewImpact && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-3 flex items-center gap-2">
                  <AlertCircle size={16} />
                  影响范围预览
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-red-600 font-medium">
                      受影响出圃批次：
                    </span>
                    <span className="text-red-800">
                      {previewImpact.affected_seedling_batches.length} 个
                    </span>
                    {previewImpact.affected_seedling_batches.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {previewImpact.affected_seedling_batches.map((b) => (
                          <div
                            key={b.id}
                            className="text-xs bg-white p-1.5 rounded border border-red-100"
                          >
                            {b.batch_code}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-red-600 font-medium">
                      受影响调运单：
                    </span>
                    <span className="text-red-800">
                      {previewImpact.affected_dispatch_orders.length} 个
                    </span>
                    {previewImpact.affected_dispatch_orders.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {previewImpact.affected_dispatch_orders.map((o) => (
                          <div
                            key={o.id}
                            className="text-xs bg-white p-1.5 rounded border border-red-100"
                          >
                            {o.order_code}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-red-600 font-medium">
                      受影响推广点：
                    </span>
                    <span className="text-red-800">
                      {previewImpact.affected_promotion_sites.length} 个
                    </span>
                    {previewImpact.affected_promotion_sites.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {previewImpact.affected_promotion_sites.map((s) => (
                          <div
                            key={s.id}
                            className="text-xs bg-white p-1.5 rounded border border-red-100"
                          >
                            {s.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-sm text-red-700">
                  共涉及{" "}
                  {previewImpact.affected_seedling_batches.length +
                    previewImpact.affected_dispatch_orders.length +
                    previewImpact.affected_promotion_sites.length}{" "}
                  个召回项
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="btn-primary"
                disabled={
                  !previewImpact ||
                  (previewImpact.affected_seedling_batches.length +
                    previewImpact.affected_dispatch_orders.length +
                    previewImpact.affected_promotion_sites.length ===
                    0) ||
                  submitting
                }
              >
                {submitting ? "提交中..." : "确认发起召回"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setPreviewImpact(null);
                  setForm({
                    batch_type: "seed",
                    batch_id: 0,
                    batch_code: "",
                    reason: "",
                    created_by: "",
                  });
                }}
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
              <th className="text-left p-3">召回编号</th>
              <th className="text-left p-3">问题批次类型</th>
              <th className="text-left p-3">问题批次号</th>
              <th className="text-left p-3">召回原因</th>
              <th className="text-left p-3">总项数</th>
              <th className="text-left p-3">完成进度</th>
              <th className="text-left p-3">状态</th>
              <th className="text-left p-3">发起人</th>
              <th className="text-left p-3">创建时间</th>
              <th className="text-left p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr
                key={r.id}
                className="border-t border-forest-50 hover:bg-forest-50/50"
              >
                <td className="p-3 font-mono text-forest-700">
                  {r.recall_code}
                </td>
                <td className="p-3">
                  {batchTypeMap[r.batch_type] || r.batch_type}
                </td>
                <td className="p-3 font-medium">{r.batch_code}</td>
                <td className="p-3 max-w-xs truncate" title={r.reason}>
                  {r.reason}
                </td>
                <td className="p-3">{r.total_items}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-forest-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-forest-600 transition-all"
                        style={{ width: `${getProgressPercentage(r)}%` }}
                      />
                    </div>
                    <span className="text-xs text-forest-600">
                      {r.completed_items}/{r.total_items} ({getProgressPercentage(r)}%)
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      statusMap[r.status]?.className
                    }`}
                  >
                    {statusMap[r.status]?.label}
                  </span>
                </td>
                <td className="p-3">{r.created_by}</td>
                <td className="p-3 text-xs">{r.created_at}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <button
                      className="btn-primary text-xs flex items-center gap-1"
                      onClick={() => navigate(`/recalls/${r.id}`)}
                    >
                      <Eye size={12} /> 详情
                    </button>
                    {r.status !== "completed" && r.status !== "cancelled" && (
                      <button
                        className="btn-secondary text-xs flex items-center gap-1 text-amber-700"
                        onClick={() => handleCancel(r.id)}
                      >
                        <XCircle size={12} /> 取消
                      </button>
                    )}
                    {r.status === "cancelled" && (
                      <button
                        className="btn-secondary text-xs flex items-center gap-1 text-red-700"
                        onClick={() => handleDelete(r.id)}
                      >
                        <Trash2 size={12} /> 删除
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <div className="text-center py-8 text-forest-500">暂无召回记录</div>
        )}
      </div>
    </div>
  );
}

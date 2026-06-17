import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import {
  fetchPlantingFeedbacks,
  createPlantingFeedback,
  updatePlantingFeedback,
  deletePlantingFeedback,
  fetchDispatchOrders,
  fetchPromotionSites,
} from "@/api/client";
import type {
  PlantingFeedback,
  DispatchOrder,
  PromotionSite,
} from "@shared/types";

const growthStatusMap: Record<string, { label: string; cls: string }> = {
  excellent: { label: "优秀", cls: "bg-emerald-100 text-emerald-700" },
  good: { label: "良好", cls: "bg-green-100 text-green-700" },
  normal: { label: "一般", cls: "bg-amber-100 text-amber-700" },
  poor: { label: "较差", cls: "bg-orange-100 text-orange-700" },
  dead: { label: "死亡", cls: "bg-red-100 text-red-700" },
};

export default function PlantingFeedbacks() {
  const [list, setList] = useState<PlantingFeedback[]>([]);
  const [dispatchOrders, setDispatchOrders] = useState<DispatchOrder[]>([]);
  const [promotionSites, setPromotionSites] = useState<PromotionSite[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    dispatch_order_id: 0,
    plot_location: "",
    plot_area: 0,
    planted_quantity: 0,
    survival_rate: 0,
    growth_status: "normal" as PlantingFeedback["growth_status"],
    feedback_date: "",
    remark: "",
  });
  const [filterSite, setFilterSite] = useState<number | "">("");

  const load = () => {
    const params: { promotion_site_id?: number } = {};
    if (filterSite) params.promotion_site_id = filterSite;
    fetchPlantingFeedbacks(params)
      .then(setList)
      .catch(() => {});
    fetchDispatchOrders()
      .then((data) => {
        const received = data.filter((d) => d.status === "received");
        setDispatchOrders(received);
      })
      .catch(() => {});
    fetchPromotionSites()
      .then(setPromotionSites)
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [filterSite]);

  const resetForm = () => {
    setForm({
      dispatch_order_id: 0,
      plot_location: "",
      plot_area: 0,
      planted_quantity: 0,
      survival_rate: 0,
      growth_status: "normal",
      feedback_date: "",
      remark: "",
    });
    setEditingId(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (item: PlantingFeedback) => {
    setForm({
      dispatch_order_id: item.dispatch_order_id,
      plot_location: item.plot_location,
      plot_area: item.plot_area,
      planted_quantity: item.planted_quantity,
      survival_rate: item.survival_rate,
      growth_status: item.growth_status,
      feedback_date: item.feedback_date,
      remark: item.remark,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updatePlantingFeedback(editingId, form);
    } else {
      await createPlantingFeedback(form);
    }
    resetForm();
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm("确定删除该反馈记录吗？")) {
      await deletePlantingFeedback(id);
      load();
    }
  };

  const getDispatchOrderLabel = (orderId: number) => {
    const order = dispatchOrders.find((o) => o.id === orderId);
    if (!order) return "-";
    return `${(order as any).order_code || order.id} - ${(order as any).promotion_site_name || ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-bold">造林成效反馈</h2>
        <button
          className="btn-primary flex items-center gap-1"
          onClick={handleAdd}
        >
          <Plus size={16} /> 录入反馈
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="label mb-0">推广点筛选：</label>
            <select
              className="input w-48"
              value={filterSite}
              onChange={(e) =>
                setFilterSite(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">全部推广点</option>
              {promotionSites.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-medium mb-4">
            {editingId ? "编辑成效反馈" : "新增成效反馈"}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">调运单（已收苗）</label>
              <select
                className="input"
                value={form.dispatch_order_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dispatch_order_id: Number(e.target.value),
                  })
                }
                disabled={!!editingId}
                required
              >
                <option value={0}>请选择调运单</option>
                {dispatchOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {(o as any).order_code} - {(o as any).promotion_site_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">反馈日期</label>
              <input
                type="date"
                className="input"
                value={form.feedback_date}
                onChange={(e) =>
                  setForm({ ...form, feedback_date: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">造林地块位置</label>
              <input
                type="text"
                className="input"
                value={form.plot_location}
                onChange={(e) =>
                  setForm({ ...form, plot_location: e.target.value })
                }
                placeholder="如：东山坡3号地"
                required
              />
            </div>
            <div>
              <label className="label">造林面积（亩）</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.plot_area}
                onChange={(e) =>
                  setForm({ ...form, plot_area: Number(e.target.value) })
                }
                required
              />
            </div>
            <div>
              <label className="label">实际种植数量（株）</label>
              <input
                type="number"
                className="input"
                value={form.planted_quantity}
                onChange={(e) =>
                  setForm({ ...form, planted_quantity: Number(e.target.value) })
                }
                required
              />
            </div>
            <div>
              <label className="label">成活率（%）</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="input"
                value={form.survival_rate}
                onChange={(e) =>
                  setForm({ ...form, survival_rate: Number(e.target.value) })
                }
                required
              />
            </div>
            <div>
              <label className="label">长势情况</label>
              <select
                className="input"
                value={form.growth_status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    growth_status: e.target
                      .value as PlantingFeedback["growth_status"],
                  })
                }
                required
              >
                <option value="excellent">优秀</option>
                <option value="good">良好</option>
                <option value="normal">一般</option>
                <option value="poor">较差</option>
                <option value="dead">死亡</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">备注</label>
              <textarea
                className="input"
                rows={3}
                value={form.remark}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
                placeholder="请输入其他需要说明的情况..."
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="btn-primary">
                {editingId ? "保存修改" : "提交反馈"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="text-left p-3">推广点</th>
              <th className="text-left p-3">调运单号</th>
              <th className="text-left p-3">出圃批次</th>
              <th className="text-left p-3">种源</th>
              <th className="text-left p-3">地块位置</th>
              <th className="text-left p-3">面积(亩)</th>
              <th className="text-left p-3">种植数(株)</th>
              <th className="text-left p-3">成活率</th>
              <th className="text-left p-3">长势</th>
              <th className="text-left p-3">反馈日期</th>
              <th className="text-left p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-forest-500">
                  暂无反馈记录
                </td>
              </tr>
            ) : (
              list.map((item) => {
                const gs =
                  growthStatusMap[item.growth_status] || growthStatusMap.normal;
                return (
                  <tr
                    key={item.id}
                    className="border-t border-forest-50 hover:bg-forest-50/50"
                  >
                    <td className="p-3">
                      {(item as any).promotion_site_name || "-"}
                    </td>
                    <td className="p-3">
                      {(item as any).dispatch_order_code || "-"}
                    </td>
                    <td className="p-3">
                      {(item as any).seedling_batch_code || "-"}
                    </td>
                    <td className="p-3">
                      {(item as any).seed_source_name || "-"}
                    </td>
                    <td className="p-3">{item.plot_location || "-"}</td>
                    <td className="p-3">{item.plot_area}</td>
                    <td className="p-3">{item.planted_quantity}</td>
                    <td className="p-3">{item.survival_rate}%</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${gs.cls}`}
                      >
                        {gs.label}
                      </span>
                    </td>
                    <td className="p-3">{item.feedback_date}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          className="text-forest-600 hover:text-forest-900"
                          onClick={() => handleEdit(item)}
                          title="编辑"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDelete(item.id)}
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  fetchDispatchOrders,
  createDispatchOrder,
  updateDispatchOrder,
  fetchSeedlingBatches,
  fetchPromotionSites,
} from "@/api/client";
import type {
  DispatchOrder,
  SeedlingBatch,
  PromotionSite,
} from "@shared/types";

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "待发运", cls: "bg-amber-100 text-amber-700" },
  delivered: { label: "已发运", cls: "bg-blue-100 text-blue-700" },
  received: { label: "已收苗", cls: "bg-forest-100 text-forest-700" },
};

export default function DispatchOrders() {
  const [list, setList] = useState<DispatchOrder[]>([]);
  const [seedlingBatches, setSeedlingBatches] = useState<SeedlingBatch[]>([]);
  const [promotionSites, setPromotionSites] = useState<PromotionSite[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    seedling_batch_id: 0,
    promotion_site_id: 0,
    quantity: 0,
    dispatch_date: "",
  });

  const load = () => {
    fetchDispatchOrders()
      .then(setList)
      .catch(() => {});
    fetchSeedlingBatches()
      .then(setSeedlingBatches)
      .catch(() => {});
    fetchPromotionSites()
      .then(setPromotionSites)
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDispatchOrder(form);
    setForm({
      seedling_batch_id: 0,
      promotion_site_id: 0,
      quantity: 0,
      dispatch_date: "",
    });
    setShowForm(false);
    load();
  };

  const handleConfirm = async (
    id: number,
    status: "delivered" | "received",
  ) => {
    await updateDispatchOrder(id, { status });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-bold">调运单</h2>
        <button
          className="btn-primary flex items-center gap-1"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} /> 新增调运单
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">出圃批次</label>
              <select
                className="input"
                value={form.seedling_batch_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    seedling_batch_id: Number(e.target.value),
                  })
                }
                required
              >
                <option value={0}>请选择</option>
                {seedlingBatches.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.batch_code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">推广点</label>
              <select
                className="input"
                value={form.promotion_site_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    promotion_site_id: Number(e.target.value),
                  })
                }
                required
              >
                <option value={0}>请选择</option>
                {promotionSites.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">数量</label>
              <input
                type="number"
                className="input"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: Number(e.target.value) })
                }
                required
              />
            </div>
            <div>
              <label className="label">调运日期</label>
              <input
                type="date"
                className="input"
                value={form.dispatch_date}
                onChange={(e) =>
                  setForm({ ...form, dispatch_date: e.target.value })
                }
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

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="text-left p-3">调运单号</th>
              <th className="text-left p-3">出圃批次</th>
              <th className="text-left p-3">推广点</th>
              <th className="text-left p-3">数量</th>
              <th className="text-left p-3">调运日期</th>
              <th className="text-left p-3">状态</th>
              <th className="text-left p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => {
              const st = statusMap[item.status] || statusMap.pending;
              return (
                <tr
                  key={item.id}
                  className="border-t border-forest-50 hover:bg-forest-50/50"
                >
                  <td className="p-3 font-medium">{item.order_code}</td>
                  <td className="p-3">
                    {(item as any).seedling_batch_code || "-"}
                  </td>
                  <td className="p-3">
                    {(item as any).promotion_site_name || "-"}
                  </td>
                  <td className="p-3">{item.quantity}</td>
                  <td className="p-3">{item.dispatch_date}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </td>
                  <td className="p-3">
                    {item.status === "pending" && (
                      <button
                        className="btn-secondary text-xs"
                        onClick={() => handleConfirm(item.id, "delivered")}
                      >
                        确认发运
                      </button>
                    )}
                    {item.status === "delivered" && (
                      <button
                        className="btn-primary text-xs"
                        onClick={() => handleConfirm(item.id, "received")}
                      >
                        确认收苗
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

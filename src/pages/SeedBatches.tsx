import { useEffect, useState } from "react";
import { Plus, ChevronDown, ChevronUp, X } from "lucide-react";
import {
  fetchSeedBatches,
  createSeedBatch,
  fetchSeedSources,
  fetchQualityInspections,
  createQualityInspection,
} from "@/api/client";
import type { SeedBatch, SeedSource, QualityInspection } from "@shared/types";

export default function SeedBatches() {
  const [list, setList] = useState<SeedBatch[]>([]);
  const [sources, setSources] = useState<SeedSource[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [inspections, setInspections] = useState<
    Record<number, QualityInspection[]>
  >({});
  const [showInspectionForm, setShowInspectionForm] = useState<number | null>(
    null,
  );
  const [inspForm, setInspForm] = useState({
    result: "qualified" as "qualified" | "unqualified",
    items: "",
    values: "",
    inspector: "",
    inspect_date: "",
  });
  const [form, setForm] = useState({
    batch_code: "",
    seed_source_id: 0,
    quantity: 0,
    unit: "kg",
    harvest_date: "",
    responsible_person: "",
  });

  const load = () => {
    fetchSeedBatches()
      .then(setList)
      .catch(() => {});
    fetchSeedSources()
      .then(setSources)
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSeedBatch(form);
    setForm({
      batch_code: "",
      seed_source_id: 0,
      quantity: 0,
      unit: "kg",
      harvest_date: "",
      responsible_person: "",
    });
    setShowForm(false);
    load();
  };

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!inspections[id]) {
      const data = await fetchQualityInspections({
        batch_type: "seed",
        batch_id: id,
      });
      setInspections((prev) => ({ ...prev, [id]: data }));
    }
  };

  const handleInspectionSubmit = async (
    e: React.FormEvent,
    batchId: number,
  ) => {
    e.preventDefault();
    await createQualityInspection({
      batch_type: "seed",
      batch_id: batchId,
      ...inspForm,
    });
    setInspForm({
      result: "qualified",
      items: "",
      values: "",
      inspector: "",
      inspect_date: "",
    });
    setShowInspectionForm(null);
    const data = await fetchQualityInspections({
      batch_type: "seed",
      batch_id: batchId,
    });
    setInspections((prev) => ({ ...prev, [batchId]: data }));
  };

  const getQualityStatus = (batchId: number) => {
    const insps = inspections[batchId];
    if (!insps || insps.length === 0)
      return <span className="text-forest-500">未质检</span>;
    const hasUnqualified = insps.some((i) => i.result === "unqualified");
    if (hasUnqualified)
      return <span className="text-red-600 font-medium">不合格</span>;
    return <span className="text-forest-600 font-medium">合格</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-bold">种子批次</h2>
        <button
          className="btn-primary flex items-center gap-1"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} /> 新增种子批次
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
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
              <label className="label">关联种源</label>
              <select
                className="input"
                value={form.seed_source_id}
                onChange={(e) =>
                  setForm({ ...form, seed_source_id: Number(e.target.value) })
                }
                required
              >
                <option value={0}>请选择</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
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
              <label className="label">单位</label>
              <input
                className="input"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
            <div>
              <label className="label">采收日期</label>
              <input
                type="date"
                className="input"
                value={form.harvest_date}
                onChange={(e) =>
                  setForm({ ...form, harvest_date: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">责任人</label>
              <input
                className="input"
                value={form.responsible_person}
                onChange={(e) =>
                  setForm({ ...form, responsible_person: e.target.value })
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
              <th className="text-left p-3"></th>
              <th className="text-left p-3">批次号</th>
              <th className="text-left p-3">关联种源</th>
              <th className="text-left p-3">数量</th>
              <th className="text-left p-3">单位</th>
              <th className="text-left p-3">采收日期</th>
              <th className="text-left p-3">责任人</th>
              <th className="text-left p-3">质检状态</th>
              <th className="text-left p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <>
                <tr
                  key={item.id}
                  className="border-t border-forest-50 hover:bg-forest-50/50"
                >
                  <td className="p-3">
                    <button onClick={() => toggleExpand(item.id)}>
                      {expandedId === item.id ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </td>
                  <td className="p-3 font-medium">{item.batch_code}</td>
                  <td className="p-3">
                    {(item as any).seed_source_name || "-"}
                  </td>
                  <td className="p-3">{item.quantity}</td>
                  <td className="p-3">{item.unit}</td>
                  <td className="p-3">{item.harvest_date}</td>
                  <td className="p-3">{item.responsible_person}</td>
                  <td className="p-3">{getQualityStatus(item.id)}</td>
                  <td className="p-3">
                    <button
                      className="btn-secondary text-xs"
                      onClick={() => {
                        setShowInspectionForm(item.id);
                      }}
                    >
                      添加质检
                    </button>
                  </td>
                </tr>
                {expandedId === item.id && (
                  <tr key={`${item.id}-detail`}>
                    <td colSpan={9} className="p-3 bg-forest-50/30">
                      <div className="space-y-2">
                        <h4 className="font-medium text-forest-800">
                          质检记录
                        </h4>
                        {(inspections[item.id] || []).length === 0 ? (
                          <p className="text-forest-500 text-sm">
                            暂无质检记录
                          </p>
                        ) : (
                          (inspections[item.id] || []).map((insp) => (
                            <div
                              key={insp.id}
                              className="flex items-center gap-4 text-sm p-2 bg-white rounded border border-forest-100"
                            >
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${insp.result === "qualified" ? "bg-forest-100 text-forest-700" : "bg-red-100 text-red-700"}`}
                              >
                                {insp.result === "qualified"
                                  ? "合格"
                                  : "不合格"}
                              </span>
                              <span>{insp.items}</span>
                              <span>{insp.values}</span>
                              <span className="text-forest-500">
                                {insp.inspector}
                              </span>
                              <span className="text-forest-400">
                                {insp.inspect_date}
                              </span>
                            </div>
                          ))
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

      {showInspectionForm !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b border-forest-100">
              <h3 className="text-lg font-serif font-bold text-forest-800">
                添加质检记录 - 批次{" "}
                {list.find((b) => b.id === showInspectionForm)?.batch_code ||
                  ""}
              </h3>
              <button
                type="button"
                className="p-1 rounded hover:bg-gray-100 text-gray-500"
                onClick={() => setShowInspectionForm(null)}
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => handleInspectionSubmit(e, showInspectionForm!)}
              className="p-5 grid grid-cols-2 gap-4"
            >
              <div>
                <label className="label">质检结果</label>
                <select
                  className="input"
                  value={inspForm.result}
                  onChange={(e) =>
                    setInspForm({
                      ...inspForm,
                      result: e.target.value as "qualified" | "unqualified",
                    })
                  }
                >
                  <option value="qualified">合格</option>
                  <option value="unqualified">不合格</option>
                </select>
              </div>
              <div>
                <label className="label">检查日期</label>
                <input
                  type="date"
                  className="input"
                  value={inspForm.inspect_date}
                  onChange={(e) =>
                    setInspForm({
                      ...inspForm,
                      inspect_date: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">检查项目</label>
                <input
                  className="input"
                  value={inspForm.items}
                  placeholder="如：发芽率,净度,含水量"
                  onChange={(e) =>
                    setInspForm({
                      ...inspForm,
                      items: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="label">检查值</label>
                <input
                  className="input"
                  value={inspForm.values}
                  placeholder="如：92%,98%,8.5%"
                  onChange={(e) =>
                    setInspForm({
                      ...inspForm,
                      values: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-span-2">
                <label className="label">检查人</label>
                <input
                  className="input"
                  value={inspForm.inspector}
                  onChange={(e) =>
                    setInspForm({
                      ...inspForm,
                      inspector: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowInspectionForm(null)}
                >
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  提交质检
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

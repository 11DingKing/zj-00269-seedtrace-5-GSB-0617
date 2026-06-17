import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  PauseCircle,
  Save,
  RefreshCw,
  Package,
  Truck,
  MapPin,
  TrendingUp,
} from "lucide-react";
import {
  fetchRecall,
  fetchRecallProgress,
  updateRecallItem,
} from "@/api/client";
import type {
  RecallWithItems,
  RecallProgress,
  RecallItem,
  RecallItemStatus,
  DisposalMethod,
  SeedlingBatch,
  DispatchOrder,
  PromotionSite,
} from "@shared/types";

const itemTypeMap: Record<string, { label: string; icon: any; color: string }> = {
  seedling_batch: {
    label: "出圃批次",
    icon: Package,
    color: "text-forest-700 bg-forest-100",
  },
  dispatch_order: {
    label: "调运单",
    icon: Truck,
    color: "text-blue-700 bg-blue-100",
  },
  promotion_site: {
    label: "推广点",
    icon: MapPin,
    color: "text-red-700 bg-red-100",
  },
};

const itemStatusMap: Record<
  string,
  { label: string; icon: any; className: string }
> = {
  not_started: {
    label: "未开始",
    icon: Clock,
    className: "bg-gray-100 text-gray-700",
  },
  in_progress: {
    label: "处理中",
    icon: RefreshCw,
    className: "bg-blue-100 text-blue-700",
  },
  completed: {
    label: "已完成",
    icon: CheckCircle,
    className: "bg-forest-100 text-forest-700",
  },
  cancelled: {
    label: "已取消",
    icon: XCircle,
    className: "bg-gray-100 text-gray-500",
  },
};

const disposalMethodMap: Record<string, string> = {
  return: "退回",
  destroy: "销毁",
  quarantine: "隔离观察",
  other: "其他",
};

const batchTypeMap: Record<string, string> = {
  seed: "种子批次",
  nursery: "育苗批次",
  seedling: "出圃批次",
};

export default function RecallDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recall, setRecall] = useState<RecallWithItems | null>(null);
  const [progress, setProgress] = useState<RecallProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    status: "not_started" as RecallItemStatus,
    disposal_method: null as DisposalMethod | null,
    disposal_quantity: 0,
    handled_by: "",
    remark: "",
  });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [recallData, progressData] = await Promise.all([
        fetchRecall(Number(id)),
        fetchRecallProgress(Number(id)),
      ]);
      setRecall(recallData);
      setProgress(progressData);
    } catch (err: any) {
      alert(err.message || "加载数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleEdit = (item: RecallItem) => {
    setEditingItem(item.id);
    setEditForm({
      status: item.status,
      disposal_method: item.disposal_method,
      disposal_quantity: item.disposal_quantity || 0,
      handled_by: item.handled_by || "",
      remark: item.remark || "",
    });
  };

  const handleSave = async (itemId: number) => {
    if (!editForm.status) {
      alert("请选择状态");
      return;
    }
    setSaving(true);
    try {
      await updateRecallItem(itemId, {
        status: editForm.status,
        disposal_method: editForm.disposal_method || undefined,
        disposal_quantity: editForm.disposal_quantity,
        handled_by: editForm.handled_by || undefined,
        remark: editForm.remark || undefined,
      });
      setEditingItem(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const groupedItems = recall?.items.reduce((acc: Record<string, RecallItem[]>, item: RecallItem) => {
    if (!acc[item.item_type]) acc[item.item_type] = [];
    acc[item.item_type].push(item);
    return acc;
  }, {} as Record<string, RecallItem[]>) || {};

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return "bg-forest-600";
    if (percentage >= 50) return "bg-blue-600";
    if (percentage > 0) return "bg-amber-500";
    return "bg-gray-300";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-forest-600">加载中...</div>
      </div>
    );
  }

  if (!recall || !progress) {
    return (
      <div className="card text-center py-12">
        <p className="text-forest-500">未找到该召回记录</p>
        <button
          className="btn-primary mt-4"
          onClick={() => navigate("/recalls")}
        >
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          className="p-2 hover:bg-forest-50 rounded-lg transition-colors"
          onClick={() => navigate("/recalls")}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-serif font-bold">召回详情</h2>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 text-forest-600 mb-2">
            <TrendingUp size={16} />
            <span className="text-sm">完成进度</span>
          </div>
          <div className="text-3xl font-bold text-forest-800">
            {progress.percentage}%
          </div>
          <div className="text-xs text-forest-500 mt-1">
            {progress.completed}/{progress.total} 项
          </div>
          <div className="mt-3 w-full h-2 bg-forest-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getProgressColor(
                progress.percentage,
              )}`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Clock size={16} />
            <span className="text-sm">未开始</span>
          </div>
          <div className="text-3xl font-bold text-gray-700">
            {progress.not_started}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <RefreshCw size={16} />
            <span className="text-sm">处理中</span>
          </div>
          <div className="text-3xl font-bold text-blue-700">
            {progress.in_progress}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-forest-600 mb-2">
            <CheckCircle size={16} />
            <span className="text-sm">已完成</span>
          </div>
          <div className="text-3xl font-bold text-forest-700">
            {progress.completed}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-medium mb-4">召回基本信息</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-forest-500">召回编号：</span>
            <span className="font-mono font-medium">{recall.recall_code}</span>
          </div>
          <div>
            <span className="text-forest-500">问题批次类型：</span>
            <span>{batchTypeMap[recall.batch_type] || recall.batch_type}</span>
          </div>
          <div>
            <span className="text-forest-500">问题批次号：</span>
            <span className="font-medium">{recall.batch_code}</span>
          </div>
          <div>
            <span className="text-forest-500">状态：</span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                recall.status === "completed"
                  ? "bg-forest-100 text-forest-700"
                  : recall.status === "in_progress"
                    ? "bg-blue-100 text-blue-700"
                    : recall.status === "cancelled"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-amber-100 text-amber-700"
              }`}
            >
              {recall.status === "pending"
                ? "待处理"
                : recall.status === "in_progress"
                  ? "进行中"
                  : recall.status === "completed"
                    ? "已完成"
                    : "已取消"}
            </span>
          </div>
          <div>
            <span className="text-forest-500">发起人：</span>
            <span>{recall.created_by}</span>
          </div>
          <div>
            <span className="text-forest-500">创建时间：</span>
            <span>{recall.created_at}</span>
          </div>
          {recall.completed_at && (
            <div>
              <span className="text-forest-500">完成时间：</span>
              <span>{recall.completed_at}</span>
            </div>
          )}
          <div className="col-span-2">
            <span className="text-forest-500">召回原因：</span>
            <p className="mt-1 p-3 bg-forest-50 rounded text-forest-800">
              {recall.reason}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Package size={18} />
          召回处置项
        </h3>

        {Object.entries(groupedItems).map(([itemType, items]) => {
          const typeInfo = itemTypeMap[itemType];
          const TypeIcon = typeInfo?.icon || Package;
          return (
            <div key={itemType} className="card">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={`w-8 h-8 rounded-lg ${typeInfo?.color} flex items-center justify-center`}
                >
                  <TypeIcon size={18} />
                </div>
                <h4 className="font-medium">{typeInfo?.label}</h4>
                <span className="text-sm text-forest-500">
                  ({items.length} 项)
                </span>
              </div>

              <div className="space-y-3">
                {items.map((item) => {
                  const statusInfo = itemStatusMap[item.status];
                  const StatusIcon = statusInfo?.icon || Clock;
                  const isEditing = editingItem === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        item.status === "completed"
                          ? "border-forest-200 bg-forest-50/30"
                          : item.status === "cancelled"
                            ? "border-gray-200 bg-gray-50/30 opacity-60"
                            : "border-forest-100 bg-white hover:border-forest-200"
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="label">处置状态</label>
                              <select
                                className="input"
                                value={editForm.status}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    status: e.target.value as RecallItemStatus,
                                  })
                                }
                              >
                                <option value="not_started">未开始</option>
                                <option value="in_progress">处理中</option>
                                <option value="completed">已完成</option>
                                <option value="cancelled">已取消</option>
                              </select>
                            </div>
                            <div>
                              <label className="label">处置方式</label>
                              <select
                                className="input"
                                value={editForm.disposal_method || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    disposal_method: e.target.value
                                      ? (e.target.value as DisposalMethod)
                                      : null,
                                  })
                                }
                              >
                                <option value="">请选择</option>
                                <option value="return">退回</option>
                                <option value="destroy">销毁</option>
                                <option value="quarantine">隔离观察</option>
                                <option value="other">其他</option>
                              </select>
                            </div>
                            <div>
                              <label className="label">处置数量</label>
                              <input
                                type="number"
                                className="input"
                                value={editForm.disposal_quantity}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    disposal_quantity: Number(
                                      e.target.value,
                                    ),
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="label">处理人</label>
                              <input
                                className="input"
                                value={editForm.handled_by}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    handled_by: e.target.value,
                                  })
                                }
                                placeholder="处理人姓名"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="label">备注</label>
                            <textarea
                              className="input min-h-[60px]"
                              value={editForm.remark}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  remark: e.target.value,
                                })
                              }
                              placeholder="处置备注信息..."
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="btn-primary flex items-center gap-1"
                              onClick={() => handleSave(item.id)}
                              disabled={saving}
                            >
                              <Save size={14} />
                              {saving ? "保存中..." : "保存"}
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={handleCancelEdit}
                              disabled={saving}
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo?.className}`}
                              >
                                <StatusIcon
                                  size={12}
                                  className="inline mr-1"
                                />
                                {statusInfo?.label}
                              </span>
                              <span className="font-medium">
                                {item.item_name}
                              </span>
                              <span className="text-xs text-forest-500 font-mono">
                                {item.item_code}
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              {item.disposal_method && (
                                <div>
                                  <span className="text-forest-500">
                                    处置方式：
                                  </span>
                                  <span>
                                    {disposalMethodMap[item.disposal_method] ||
                                      item.disposal_method}
                                  </span>
                                </div>
                              )}
                              {item.disposal_quantity > 0 && (
                                <div>
                                  <span className="text-forest-500">
                                    处置数量：
                                  </span>
                                  <span>{item.disposal_quantity}</span>
                                </div>
                              )}
                              {item.handled_by && (
                                <div>
                                  <span className="text-forest-500">
                                    处理人：
                                  </span>
                                  <span>{item.handled_by}</span>
                                </div>
                              )}
                              {item.handled_at && (
                                <div>
                                  <span className="text-forest-500">
                                    处理时间：
                                  </span>
                                  <span>{item.handled_at}</span>
                                </div>
                              )}
                            </div>
                            {item.remark && (
                              <div className="mt-2 text-sm">
                                <span className="text-forest-500">备注：</span>
                                <span className="text-forest-700">
                                  {item.remark}
                                </span>
                              </div>
                            )}
                          </div>
                          {recall.status !== "completed" &&
                            recall.status !== "cancelled" &&
                            item.status !== "cancelled" && (
                              <button
                                className="btn-primary text-xs ml-4"
                                onClick={() => handleEdit(item)}
                              >
                                标记处置
                              </button>
                            )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h3 className="font-medium mb-4">溯源链路</h3>
        <div className="relative pl-8">
          <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-forest-200" />

          {recall.seedling_batches.length > 0 && (
            <div className="relative pb-6">
              <div className="flex items-start gap-4">
                <div className="relative z-10 w-8 h-8 rounded-full bg-forest-200 border-2 border-forest-500 flex items-center justify-center text-sm flex-shrink-0 -ml-8">
                  🌳
                </div>
                <div className="flex-1 rounded-lg border border-forest-400 bg-forest-100 p-4">
                  <div className="font-bold text-forest-800 mb-2">
                    出圃批次 ({recall.seedling_batches.length} 个)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {recall.seedling_batches.map((b: SeedlingBatch) => (
                      <div
                        key={b.id}
                        className="text-xs bg-white p-2 rounded border border-forest-200"
                      >
                        <div className="font-medium">{b.batch_code}</div>
                        <div className="text-forest-600">
                          数量：{b.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {recall.dispatch_orders.length > 0 && (
            <div className="relative pb-6">
              <div className="flex items-start gap-4">
                <div className="relative z-10 w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-400 flex items-center justify-center text-sm flex-shrink-0 -ml-8">
                  🚛
                </div>
                <div className="flex-1 rounded-lg border border-blue-400 bg-blue-50 p-4">
                  <div className="font-bold text-blue-800 mb-2">
                    调运单 ({recall.dispatch_orders.length} 个)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {recall.dispatch_orders.map((o: DispatchOrder) => (
                      <div
                        key={o.id}
                        className="text-xs bg-white p-2 rounded border border-blue-200"
                      >
                        <div className="font-medium">{o.order_code}</div>
                        <div className="text-blue-600">
                          发往：{(o as any).promotion_site_name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {recall.promotion_sites.length > 0 && (
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="relative z-10 w-8 h-8 rounded-full bg-red-100 border-2 border-red-400 flex items-center justify-center text-sm flex-shrink-0 -ml-8">
                  📍
                </div>
                <div className="flex-1 rounded-lg border border-red-400 bg-red-50 p-4">
                  <div className="font-bold text-red-800 mb-2">
                    推广点 ({recall.promotion_sites.length} 个)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {recall.promotion_sites.map((s: PromotionSite) => (
                      <div
                        key={s.id}
                        className="text-xs bg-white p-2 rounded border border-red-200"
                      >
                        <div className="font-medium">{s.name}</div>
                        <div className="text-red-600">{s.address}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Plus, MapPin, User, Phone } from "lucide-react";
import {
  fetchPromotionSites,
  createPromotionSite,
  fetchDispatchOrders,
} from "@/api/client";
import type { PromotionSite, DispatchOrder } from "@shared/types";

export default function PromotionSites() {
  const [list, setList] = useState<PromotionSite[]>([]);
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    responsible_person: "",
    contact_phone: "",
  });

  const load = () => {
    fetchPromotionSites()
      .then(setList)
      .catch(() => {});
    fetchDispatchOrders()
      .then(setOrders)
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPromotionSite(form);
    setForm({
      name: "",
      address: "",
      responsible_person: "",
      contact_phone: "",
    });
    setShowForm(false);
    load();
  };

  const getReceivedCount = (siteId: number) => {
    return orders
      .filter((o) => o.promotion_site_id === siteId && o.status === "received")
      .reduce((sum, o) => sum + o.quantity, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-bold">推广点</h2>
        <button
          className="btn-primary flex items-center gap-1"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} /> 新增推广点
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">名称</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">地址</label>
              <input
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">负责人</label>
              <input
                className="input"
                value={form.responsible_person}
                onChange={(e) =>
                  setForm({ ...form, responsible_person: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">联系电话</label>
              <input
                className="input"
                value={form.contact_phone}
                onChange={(e) =>
                  setForm({ ...form, contact_phone: e.target.value })
                }
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((site) => (
          <div key={site.id} className="card">
            <h3 className="text-lg font-serif font-bold text-forest-950 mb-3">
              {site.name}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-forest-700">
                <MapPin size={16} />
                <span>{site.address}</span>
              </div>
              <div className="flex items-center gap-2 text-forest-700">
                <User size={16} />
                <span>{site.responsible_person}</span>
              </div>
              <div className="flex items-center gap-2 text-forest-700">
                <Phone size={16} />
                <span>{site.contact_phone || "-"}</span>
              </div>
              <div className="pt-2 border-t border-forest-100">
                <span className="text-forest-500">已收苗数量: </span>
                <span className="font-bold text-forest-950">
                  {getReceivedCount(site.id)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

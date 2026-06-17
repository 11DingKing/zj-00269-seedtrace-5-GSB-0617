import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { fetchSeedSources, createSeedSource } from "@/api/client";
import type { SeedSource } from "@shared/types";

export default function SeedSources() {
  const [list, setList] = useState<SeedSource[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    species: "云杉",
    description: "",
  });

  const load = () =>
    fetchSeedSources()
      .then(setList)
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSeedSource(form);
    setForm({ name: "", location: "", species: "云杉", description: "" });
    setShowForm(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-bold">种源管理</h2>
        <button
          className="btn-primary flex items-center gap-1"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} /> 新增种源
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
              <label className="label">地点</label>
              <input
                className="input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">树种</label>
              <input
                className="input"
                value={form.species}
                onChange={(e) => setForm({ ...form, species: e.target.value })}
              />
            </div>
            <div>
              <label className="label">描述</label>
              <input
                className="input"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
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

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">名称</th>
              <th className="text-left p-3">地点</th>
              <th className="text-left p-3">树种</th>
              <th className="text-left p-3">描述</th>
              <th className="text-left p-3">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr
                key={item.id}
                className="border-t border-forest-50 hover:bg-forest-50/50"
              >
                <td className="p-3">{item.id}</td>
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3">{item.location}</td>
                <td className="p-3">{item.species}</td>
                <td className="p-3">{item.description}</td>
                <td className="p-3">{item.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

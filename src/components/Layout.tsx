import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  TreePine,
  Package,
  Sprout,
  TreeDeciduous,
  Truck,
  MapPin,
  Search,
  AlertTriangle,
  BarChart3,
  Menu,
  X,
  Leaf,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import { useStore } from "@/store";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "仪表盘" },
  { to: "/seed-sources", icon: TreePine, label: "种源管理" },
  { to: "/seed-batches", icon: Package, label: "种子批次" },
  { to: "/nursery-batches", icon: Sprout, label: "育苗批次" },
  { to: "/seedling-batches", icon: TreeDeciduous, label: "出圃批次" },
  { to: "/dispatch-orders", icon: Truck, label: "调运单" },
  { to: "/promotion-sites", icon: MapPin, label: "推广点" },
  { to: "/planting-feedbacks", icon: Leaf, label: "成效反馈" },
  { to: "/effectiveness", icon: TrendingUp, label: "成效汇总" },
  { to: "/trace", icon: Search, label: "溯源查询" },
  { to: "/warnings", icon: AlertTriangle, label: "预警中心" },
  { to: "/recalls", icon: RotateCcw, label: "召回管理" },
  { to: "/statistics", icon: BarChart3, label: "统计报表" },
];

export default function Layout() {
  const { sidebarOpen, toggleSidebar } = useStore();

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } bg-forest-950 text-white transition-all duration-300 flex-shrink-0 overflow-hidden`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 text-xl font-serif font-bold border-b border-forest-800 flex items-center gap-2">
            <span className="text-2xl">🌲</span>
            <span>云杉溯源</span>
          </div>
          <nav className="flex-1 py-4 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-forest-800 text-white"
                      : "text-forest-300 hover:bg-forest-900 hover:text-white"
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-forest-100 flex items-center px-4 gap-4 flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="p-1 hover:bg-forest-50 rounded"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="text-lg font-serif font-bold text-forest-950">
            云杉良种推广溯源平台
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Grid3X3,
  ShoppingBag,
  ClipboardList,
  DollarSign,
  Package,
  Printer,
  Truck,
  Star,
  UserCog,
  CreditCard,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Usuarios", path: "/usuarios" },
  { icon: Grid3X3, label: "Mesas", path: "/mesas" },
  { icon: ShoppingBag, label: "Productos", path: "/productos" },
  { icon: ClipboardList, label: "Pedidos", path: "/pedidos" },
  { icon: DollarSign, label: "Caja", path: "/caja" },
  { icon: Package, label: "Inventario", path: "/inventario" },
  { icon: Printer, label: "Impresión", path: "/impresion" },
  { icon: Truck, label: "Delivery", path: "/delivery" },
  { icon: Star, label: "Fidelización", path: "/fidelizacion" },
  { icon: UserCog, label: "Personal", path: "/personal" },
  { icon: CreditCard, label: "POS", path: "/pos" },
  { icon: BarChart3, label: "Análisis", path: "/analisis" },
];

const Layout = ({ children }: LayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`sidebar-gradient border-r border-sidebar-border flex flex-col transition-all duration-300 ${
          collapsed ? "w-[70px]" : "w-[240px]"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-lg text-foreground truncate">
              RestaurantPOS
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "gradient-primary text-primary-foreground shadow-md"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "" : "text-muted-foreground group-hover:text-primary"}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="font-display font-semibold text-lg text-foreground">
            {menuItems.find((i) => i.path === location.pathname)?.label || "Dashboard"}
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">Admin</p>
              <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
              A
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

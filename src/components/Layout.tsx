import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Grid3X3, ShoppingBag, ClipboardList,
  DollarSign, Package, Printer, Truck, Star, UserCog, CreditCard,
  BarChart3, FileBarChart, LogOut, ChevronLeft, ChevronRight, UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AppModule, roleDisplayName } from "@/lib/permissions";

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  module: AppModule;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", module: "dashboard" },
  { icon: Users, label: "Usuarios", path: "/usuarios", module: "usuarios" },
  { icon: Grid3X3, label: "Mesas", path: "/mesas", module: "mesas" },
  { icon: ShoppingBag, label: "Productos", path: "/productos", module: "productos" },
  { icon: ClipboardList, label: "Pedidos", path: "/pedidos", module: "pedidos" },
  { icon: DollarSign, label: "Caja", path: "/caja", module: "caja" },
  { icon: Package, label: "Inventario", path: "/inventario", module: "inventario" },
  { icon: Printer, label: "Impresión", path: "/impresion", module: "impresion" },
  { icon: Truck, label: "Delivery", path: "/delivery", module: "delivery" },
  { icon: Star, label: "Fidelización", path: "/fidelizacion", module: "fidelizacion" },
  { icon: UserCog, label: "Personal", path: "/personal", module: "personal" },
  { icon: CreditCard, label: "POS", path: "/pos", module: "pos" },
  { icon: BarChart3, label: "Análisis", path: "/analisis", module: "analisis" },
  { icon: FileBarChart, label: "Reportes", path: "/reportes", module: "reportes" },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut, fullName, userRole, hasAccess } = useAuth();

  const visibleItems = menuItems.filter((item) => hasAccess(item.module));
  const displayRole = userRole ? roleDisplayName[userRole] : "";
  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`sidebar-gradient border-r border-sidebar-border flex flex-col transition-all duration-300 ${
          collapsed ? "w-[70px]" : "w-[240px]"
        }`}
      >
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

        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-1">
          {visibleItems.map((item) => {
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

        <div className="p-2 border-t border-sidebar-border space-y-1">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="font-display font-semibold text-lg text-foreground">
            {menuItems.find((i) => i.path === location.pathname)?.label || "Dashboard"}
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{fullName || "Usuario"}</p>
              <p className="text-xs text-muted-foreground">{displayRole}</p>
            </div>
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
              {initials}
            </div>
          </div>
        </header>

        <div className="p-6 animate-fade-in">{children}</div>
      </main>
    </div>
  );
};

export default Layout;

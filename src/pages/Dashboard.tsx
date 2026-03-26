import { useState, useEffect } from "react";
import {
  ClipboardList,
  DollarSign,
  Grid3X3,
  TrendingUp,
  Users,
  Package,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface InventoryAlert {
  id: string;
  product_name: string;
  current_stock: number;
  min_stock: number;
  unit: string;
}

const stats = [
  { label: "Ventas Hoy", value: "$1.245.000", change: "+12%", up: true, icon: DollarSign, color: "text-success" },
  { label: "Pedidos Activos", value: "18", change: "+3", up: true, icon: ClipboardList, color: "text-info" },
  { label: "Mesas Ocupadas", value: "12/20", change: "60%", up: false, icon: Grid3X3, color: "text-primary" },
  { label: "Clientes Hoy", value: "87", change: "+8%", up: true, icon: Users, color: "text-accent" },
];

const recentOrders = [
  { id: "#001", table: "Mesa 5", items: 4, total: "$45.000", status: "En cocina", time: "12:30" },
  { id: "#002", table: "Mesa 3", items: 2, total: "$28.000", status: "Servido", time: "12:25" },
  { id: "#003", table: "Mesa 8", items: 6, total: "$72.000", status: "En preparación", time: "12:20" },
  { id: "#004", table: "Mesa 1", items: 3, total: "$35.000", status: "Pendiente", time: "12:15" },
  { id: "#005", table: "Delivery", items: 2, total: "$22.000", status: "En camino", time: "12:10" },
];

const statusColors: Record<string, string> = {
  "En cocina": "bg-warning/20 text-warning",
  "Servido": "bg-success/20 text-success",
  "En preparación": "bg-info/20 text-info",
  "Pendiente": "bg-muted text-muted-foreground",
  "En camino": "bg-primary/20 text-primary",
};

const Dashboard = () => {
  const [lowStockItems, setLowStockItems] = useState<InventoryAlert[]>([]);

  useEffect(() => {
    const fetchLowStock = async () => {
      const { data: items } = await supabase
        .from("inventory_items")
        .select("id, product_id, current_stock, min_stock, unit");

      if (!items || items.length === 0) return;

      const low = items.filter((i: any) => i.current_stock <= i.min_stock);
      if (low.length === 0) { setLowStockItems([]); return; }

      const productIds = low.map((i: any) => i.product_id);
      const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds);

      const nameMap = new Map((products || []).map((p: any) => [p.id, p.name]));
      setLowStockItems(
        low.map((i: any) => ({
          id: i.id,
          product_name: nameMap.get(i.product_id) || "Producto",
          current_stock: Number(i.current_stock),
          min_stock: Number(i.min_stock),
          unit: i.unit,
        }))
      );
    };

    fetchLowStock();

    const channel = supabase
      .channel("dashboard-inventory")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_items" }, () => fetchLowStock())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="space-y-6">
      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="font-display font-semibold text-destructive">
              Stock Crítico — {lowStockItems.length} producto{lowStockItems.length > 1 ? "s" : ""}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-foreground">{item.product_name}</span>
                </div>
                <span className="text-xs font-semibold text-destructive">
                  {item.current_stock} / {item.min_stock} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card-hover p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${stat.up ? "text-success" : "text-muted-foreground"}`}>
                {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">Pedidos Recientes</h3>
            <span className="text-xs text-muted-foreground">Últimos 5</span>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-primary font-semibold">{order.id}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{order.table}</p>
                    <p className="text-xs text-muted-foreground">{order.items} items · {order.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{order.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular items */}
        <div className="glass-card p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">Productos Populares</h3>
          <div className="space-y-3">
            {[
              { name: "Lomo a lo Pobre", sales: 24, category: "Carne" },
              { name: "Pisco Sour", sales: 18, category: "Cocktail" },
              { name: "Pollo Asado", sales: 15, category: "Pollo" },
              { name: "Pulpo al Olivo", sales: 12, category: "Pulpo" },
              { name: "Cerveza Artesanal", sales: 30, category: "Cervezas" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{item.sales} ventas</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

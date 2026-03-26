import { useState, useEffect } from "react";
import {
  ClipboardList,
  DollarSign,
  Grid3X3,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface InventoryAlert {
  id: string;
  product_name: string;
  current_stock: number;
  min_stock: number;
  unit: string;
}

interface DashboardStats {
  salesToday: number;
  activeOrders: number;
  occupiedTables: number;
  totalTables: number;
  guestsToday: number;
}

interface RecentOrder {
  id: string;
  order_number: number;
  table_number: number | null;
  table_label: string;
  items_count: number;
  total: number;
  status: string;
  time: string;
}

interface PopularProduct {
  name: string;
  category: string;
  sales: number;
}

const orderStatusMap: Record<string, string> = {
  pending: "Pendiente",
  in_preparation: "En preparación",
  ready: "Listo",
  served: "Servido",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  "En preparación": "bg-warning/20 text-warning",
  "Servido": "bg-success/20 text-success",
  "Listo": "bg-info/20 text-info",
  "Pendiente": "bg-muted text-muted-foreground",
  "Cancelado": "bg-destructive/20 text-destructive",
};

const formatCLP = (n: number) =>
  "$" + n.toLocaleString("es-CL");

const Dashboard = () => {
  const [lowStockItems, setLowStockItems] = useState<InventoryAlert[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ salesToday: 0, activeOrders: 0, occupiedTables: 0, totalTables: 0, guestsToday: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([]);
  const [hourlySales, setHourlySales] = useState<{ hora: string; ventas: number; pedidos: number }[]>([]);
  const [categorySales, setCategorySales] = useState<{ name: string; value: number }[]>([]);

  const CATEGORY_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "hsl(var(--info))",
    "hsl(var(--destructive))",
    "hsl(var(--accent))",
    "hsl(30 80% 55%)",
    "hsl(280 60% 55%)",
  ];

  const fetchCategorySales = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: items } = await supabase
      .from("order_items")
      .select("product_id, quantity, subtotal")
      .gte("created_at", todayStart.toISOString());

    if (!items || items.length === 0) { setCategorySales([]); return; }

    const productIds = [...new Set(items.map((i: any) => i.product_id))];
    const { data: products } = await supabase
      .from("products")
      .select("id, category_id")
      .in("id", productIds);

    const categoryIds = [...new Set((products || []).map((p: any) => p.category_id).filter(Boolean))];
    const { data: categories } = categoryIds.length > 0
      ? await supabase.from("categories").select("id, name").in("id", categoryIds)
      : { data: [] };

    const catNameMap = new Map((categories || []).map((c: any) => [c.id, c.name]));
    const prodCatMap = new Map((products || []).map((p: any) => [p.id, p.category_id]));

    const salesByCat = new Map<string, number>();
    items.forEach((i: any) => {
      const catId = prodCatMap.get(i.product_id);
      const catName = catId ? catNameMap.get(catId) || "Sin categoría" : "Sin categoría";
      salesByCat.set(catName, (salesByCat.get(catName) || 0) + i.subtotal);
    });

    const sorted = Array.from(salesByCat.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    setCategorySales(sorted);
  };

  const fetchHourlySales = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: payments } = await supabase
      .from("payments")
      .select("amount, created_at")
      .gte("created_at", todayStart.toISOString());

    const { data: orders } = await supabase
      .from("orders")
      .select("id, created_at")
      .gte("created_at", todayStart.toISOString());

    const now = new Date();
    const currentHour = now.getHours();
    const startHour = Math.max(8, Math.min(...(payments || []).map(p => new Date(p.created_at).getHours()), ...(orders || []).map(o => new Date(o.created_at).getHours()), currentHour));
    
    const hourlyData: { hora: string; ventas: number; pedidos: number }[] = [];
    for (let h = startHour; h <= Math.min(currentHour, 23); h++) {
      const label = `${h.toString().padStart(2, "0")}:00`;
      const salesInHour = (payments || [])
        .filter(p => new Date(p.created_at).getHours() === h)
        .reduce((s, p) => s + p.amount, 0);
      const ordersInHour = (orders || [])
        .filter(o => new Date(o.created_at).getHours() === h).length;
      hourlyData.push({ hora: label, ventas: salesInHour, pedidos: ordersInHour });
    }
    if (hourlyData.length === 0) {
      for (let h = 8; h <= 23; h++) {
        hourlyData.push({ hora: `${h.toString().padStart(2, "0")}:00`, ventas: 0, pedidos: 0 });
      }
    }
    setHourlySales(hourlyData);
  };

  const fetchStats = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const [paymentsRes, ordersRes, tablesRes] = await Promise.all([
      supabase.from("payments").select("amount").gte("created_at", todayISO),
      supabase.from("orders").select("id, guests, status").gte("created_at", todayISO),
      supabase.from("restaurant_tables").select("id, status"),
    ]);

    const salesToday = (paymentsRes.data || []).reduce((s, p) => s + p.amount, 0);
    const allOrders = ordersRes.data || [];
    const activeOrders = allOrders.filter((o) => o.status !== "served" && o.status !== "cancelled").length;
    const guestsToday = allOrders.reduce((s, o) => s + (o.guests || 0), 0);
    const allTables = tablesRes.data || [];
    const occupiedTables = allTables.filter((t) => t.status === "occupied").length;

    setStats({ salesToday, activeOrders, occupiedTables, totalTables: allTables.length, guestsToday });
  };

  const fetchRecentOrders = async () => {
    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_number, table_id, total, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!orders || orders.length === 0) { setRecentOrders([]); return; }

    const tableIds = orders.map((o) => o.table_id).filter(Boolean) as string[];
    const { data: tables } = tableIds.length > 0
      ? await supabase.from("restaurant_tables").select("id, table_number").in("id", tableIds)
      : { data: [] };

    const tableMap = new Map((tables || []).map((t: any) => [t.id, t.table_number]));

    const orderIds = orders.map((o) => o.id);
    const { data: items } = await supabase.from("order_items").select("order_id").in("order_id", orderIds);
    const countMap = new Map<string, number>();
    (items || []).forEach((i: any) => countMap.set(i.order_id, (countMap.get(i.order_id) || 0) + 1));

    setRecentOrders(
      orders.map((o) => {
        const tn = o.table_id ? tableMap.get(o.table_id) : null;
        const created = new Date(o.created_at);
        return {
          id: o.id,
          order_number: o.order_number,
          table_number: tn ?? null,
          table_label: tn ? `Mesa ${tn}` : "Delivery",
          items_count: countMap.get(o.id) || 0,
          total: o.total,
          status: orderStatusMap[o.status] || o.status,
          time: `${created.getHours().toString().padStart(2, "0")}:${created.getMinutes().toString().padStart(2, "0")}`,
        };
      })
    );
  };

  const fetchPopularProducts = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: items } = await supabase
      .from("order_items")
      .select("product_id, product_name, quantity")
      .gte("created_at", todayStart.toISOString());

    if (!items || items.length === 0) { setPopularProducts([]); return; }

    const salesMap = new Map<string, { name: string; sales: number }>();
    items.forEach((i: any) => {
      const cur = salesMap.get(i.product_id) || { name: i.product_name, sales: 0 };
      cur.sales += i.quantity;
      salesMap.set(i.product_id, cur);
    });

    const sorted = Array.from(salesMap.values()).sort((a, b) => b.sales - a.sales).slice(0, 5);
    setPopularProducts(sorted.map((p) => ({ name: p.name, category: "", sales: p.sales })));
  };

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
    fetchStats();
    fetchRecentOrders();
    fetchPopularProducts();
    fetchHourlySales();
    fetchCategorySales();

    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_items" }, () => fetchLowStock())
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => { fetchStats(); fetchRecentOrders(); fetchPopularProducts(); fetchHourlySales(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => { fetchStats(); fetchHourlySales(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_tables" }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => { fetchRecentOrders(); fetchPopularProducts(); fetchCategorySales(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const statCards = [
    { label: "Ventas Hoy", value: formatCLP(stats.salesToday), icon: DollarSign, color: "text-success", up: stats.salesToday > 0 },
    { label: "Pedidos Activos", value: String(stats.activeOrders), icon: ClipboardList, color: "text-info", up: stats.activeOrders > 0 },
    { label: "Mesas Ocupadas", value: `${stats.occupiedTables}/${stats.totalTables}`, icon: Grid3X3, color: "text-primary", up: false },
    { label: "Comensales Hoy", value: String(stats.guestsToday), icon: Users, color: "text-accent", up: stats.guestsToday > 0 },
  ];

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
        {statCards.map((stat) => (
          <div key={stat.label} className="glass-card-hover p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              {stat.up && (
                <div className="flex items-center gap-1 text-xs font-medium text-success">
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              )}
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Hourly Sales Chart */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-foreground">Ventas por Hora</h3>
          <span className="text-xs text-muted-foreground">Hoy</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlySales} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="hora" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                formatter={(value: number, name: string) => [name === "ventas" ? formatCLP(value) : value, name === "ventas" ? "Ventas" : "Pedidos"]}
              />
              <Area type="monotone" dataKey="ventas" stroke="hsl(var(--primary))" fill="url(#salesGradient)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="pedidos" stroke="hsl(var(--success))" fill="url(#ordersGradient)" strokeWidth={2} dot={false} yAxisId={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-6 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Ventas ($)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">Pedidos</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">Pedidos Recientes</h3>
            <span className="text-xs text-muted-foreground">Últimos 5</span>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin pedidos hoy</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-primary font-semibold">#{order.order_number}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{order.table_label}</p>
                      <p className="text-xs text-muted-foreground">{order.items_count} items · {order.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}>
                      {order.status}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{formatCLP(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Sales Chart */}
        <div className="glass-card p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">Ventas por Categoría</h3>
          {categorySales.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos hoy</p>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySales}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {categorySales.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                      formatter={(value: number) => [formatCLP(value), "Ventas"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {categorySales.map((cat, i) => {
                  const total = categorySales.reduce((s, c) => s + c.value, 0);
                  const pct = total > 0 ? ((cat.value / total) * 100).toFixed(0) : "0";
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                        <span className="text-xs text-foreground">{cat.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{pct}% · {formatCLP(cat.value)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {popularProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin ventas hoy</p>
          ) : (
            <div className="space-y-3">
              {popularProducts.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{item.sales} ventas</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

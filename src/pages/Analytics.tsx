import { DollarSign, TrendingUp, ShoppingBag, Users, Calendar, ArrowUp, ArrowDown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  guests: number;
};

type Payment = {
  id: string;
  amount: number;
  tip: number;
  method: string;
  created_at: string;
  order_id: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  subtotal: number;
  product_id: string;
};

type Product = {
  id: string;
  name: string;
  category_id: string | null;
};

type Category = {
  id: string;
  name: string;
};

const COLORS = [
  "hsl(38, 92%, 50%)",
  "hsl(199, 89%, 48%)",
  "hsl(142, 71%, 45%)",
  "hsl(0, 72%, 51%)",
  "hsl(280, 65%, 60%)",
  "hsl(45, 93%, 47%)",
  "hsl(170, 70%, 45%)",
  "hsl(330, 70%, 55%)",
];

const formatCLP = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n.toLocaleString("es-CL")}`;
};

const formatFullCLP = (n: number) => `$${n.toLocaleString("es-CL")}`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-card border border-border p-2 shadow-lg text-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name}:</span>
          <span className="font-medium">{typeof p.value === "number" && p.name.includes("Vent") ? formatFullCLP(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

const Analytics = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [ordersRes, paymentsRes, itemsRes, prodsRes, catsRes] = await Promise.all([
        supabase.from("orders").select("id, total, status, created_at, guests").neq("status", "cancelled"),
        supabase.from("payments").select("id, amount, tip, method, created_at, order_id"),
        supabase.from("order_items").select("id, order_id, product_name, quantity, subtotal, product_id"),
        supabase.from("products").select("id, name, category_id"),
        supabase.from("categories").select("id, name"),
      ]);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (paymentsRes.data) setPayments(paymentsRes.data);
      if (itemsRes.data) setOrderItems(itemsRes.data);
      if (prodsRes.data) setProducts(prodsRes.data);
      if (catsRes.data) setCategories(catsRes.data);
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Filter by period
  const now = new Date();
  const periodStart = useMemo(() => {
    const d = new Date(now);
    if (period === "day") { d.setHours(0, 0, 0, 0); }
    else if (period === "week") { d.setDate(d.getDate() - 7); }
    else { d.setMonth(d.getMonth() - 1); }
    return d;
  }, [period]);

  const filteredOrders = useMemo(() =>
    orders.filter((o) => new Date(o.created_at) >= periodStart), [orders, periodStart]);

  const filteredPayments = useMemo(() =>
    payments.filter((p) => new Date(p.created_at) >= periodStart), [payments, periodStart]);

  const filteredOrderIds = new Set(filteredOrders.map((o) => o.id));
  const filteredItems = useMemo(() =>
    orderItems.filter((i) => filteredOrderIds.has(i.order_id)), [orderItems, filteredOrders]);

  // KPIs
  const totalSales = filteredPayments.reduce((s, p) => s + p.amount, 0);
  const totalTips = filteredPayments.reduce((s, p) => s + p.tip, 0);
  const totalOrders = filteredOrders.length;
  const avgTicket = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
  const totalGuests = filteredOrders.reduce((s, o) => s + o.guests, 0);

  // Previous period for comparison
  const prevStart = useMemo(() => {
    const d = new Date(periodStart);
    if (period === "day") { d.setDate(d.getDate() - 1); }
    else if (period === "week") { d.setDate(d.getDate() - 7); }
    else { d.setMonth(d.getMonth() - 1); }
    return d;
  }, [periodStart, period]);

  const prevOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    return d >= prevStart && d < periodStart;
  });
  const prevPayments = payments.filter((p) => {
    const d = new Date(p.created_at);
    return d >= prevStart && d < periodStart;
  });
  const prevTotalSales = prevPayments.reduce((s, p) => s + p.amount, 0);
  const prevTotalOrders = prevOrders.length;
  const prevAvgTicket = prevTotalOrders > 0 ? Math.round(prevTotalSales / prevTotalOrders) : 0;
  const prevGuests = prevOrders.reduce((s, o) => s + o.guests, 0);

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  // Chart: Sales over time
  const salesByTime = useMemo(() => {
    const map = new Map<string, { label: string; ventas: number; pedidos: number }>();

    filteredOrders.forEach((o) => {
      const d = new Date(o.created_at);
      let key: string, label: string;
      if (period === "day") {
        const h = d.getHours();
        key = String(h);
        label = `${h}:00`;
      } else if (period === "week") {
        key = d.toLocaleDateString("es-CL", { weekday: "short" });
        label = key;
      } else {
        key = `${d.getDate()}/${d.getMonth() + 1}`;
        label = key;
      }
      const existing = map.get(key) || { label, ventas: 0, pedidos: 0 };
      existing.ventas += o.total;
      existing.pedidos += 1;
      map.set(key, existing);
    });

    return Array.from(map.values());
  }, [filteredOrders, period]);

  // Chart: Sales by category
  const salesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    filteredItems.forEach((item) => {
      const prod = products.find((p) => p.id === item.product_id);
      const cat = prod?.category_id ? categories.find((c) => c.id === prod.category_id) : null;
      const catName = cat?.name || "Sin categoría";
      map.set(catName, (map.get(catName) || 0) + item.subtotal);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredItems, products, categories]);

  // Chart: Payment methods
  const paymentMethods = useMemo(() => {
    const map = new Map<string, number>();
    const labels: Record<string, string> = {
      efectivo: "Efectivo", debito: "Débito", credito: "Crédito",
      transferencia: "Transferencia", cuenta_empresa: "Cta. Empresa",
    };
    filteredPayments.forEach((p) => {
      const label = labels[p.method] || p.method;
      map.set(label, (map.get(label) || 0) + p.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredPayments]);

  // Chart: Peak hours
  const peakHours = useMemo(() => {
    const map = new Map<number, number>();
    filteredOrders.forEach((o) => {
      const h = new Date(o.created_at).getHours();
      map.set(h, (map.get(h) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([hour, count]) => ({ hour: `${hour}:00`, pedidos: count }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
  }, [filteredOrders]);

  // Top products
  const topProducts = useMemo(() => {
    const map = new Map<string, { qty: number; revenue: number }>();
    filteredItems.forEach((item) => {
      const existing = map.get(item.product_name) || { qty: 0, revenue: 0 };
      existing.qty += item.quantity;
      existing.revenue += item.subtotal;
      map.set(item.product_name, existing);
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [filteredItems]);

  const periodLabel = period === "day" ? "Hoy" : period === "week" ? "Esta Semana" : "Este Mes";

  const ChangeIndicator = ({ value }: { value: number }) => (
    <span className={`text-xs font-medium flex items-center gap-0.5 ${value >= 0 ? "text-green-400" : "text-red-400"}`}>
      {value >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(value)}%
    </span>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const hasData = orders.length > 0;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" /> {periodLabel}
        </h2>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="day">Hoy</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mes</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {!hasData ? (
        <div className="glass-card p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium text-foreground mb-1">Sin datos de ventas</p>
          <p className="text-sm text-muted-foreground">Crea pedidos y registra pagos para ver los reportes aquí</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Ventas Totales", value: formatFullCLP(totalSales), change: pctChange(totalSales, prevTotalSales), icon: DollarSign },
              { label: "Ticket Promedio", value: formatFullCLP(avgTicket), change: pctChange(avgTicket, prevAvgTicket), icon: TrendingUp },
              { label: "Pedidos", value: totalOrders.toString(), change: pctChange(totalOrders, prevTotalOrders), icon: ShoppingBag },
              { label: "Comensales", value: totalGuests.toString(), change: pctChange(totalGuests, prevGuests), icon: Users },
            ].map((kpi) => (
              <div key={kpi.label} className="glass-card-hover p-5">
                <kpi.icon className="w-5 h-5 text-primary mb-2" />
                <p className="text-2xl font-display font-bold text-foreground">{kpi.value}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <ChangeIndicator value={kpi.change} />
                </div>
              </div>
            ))}
          </div>

          {/* Propinas card */}
          {totalTips > 0 && (
            <div className="glass-card p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">💰 Total Propinas</span>
              <span className="text-lg font-bold text-foreground">{formatFullCLP(totalTips)}</span>
            </div>
          )}

          {/* Sales chart */}
          <div className="glass-card p-5">
            <h3 className="font-display font-semibold text-foreground mb-4">
              Ventas {period === "day" ? "por Hora" : period === "week" ? "por Día" : "por Día del Mes"}
            </h3>
            {salesByTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={salesByTime}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(220, 10%, 55%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 55%)" }} axisLine={false} tickLine={false} tickFormatter={formatCLP} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="ventas" name="Ventas" stroke="hsl(38, 92%, 50%)" fill="url(#salesGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos para este período</p>
            )}
          </div>

          {/* Orders chart */}
          <div className="glass-card p-5">
            <h3 className="font-display font-semibold text-foreground mb-4">Pedidos {periodLabel}</h3>
            {salesByTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={salesByTime}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(220, 10%, 55%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 55%)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="pedidos" name="Pedidos" fill="hsl(199, 89%, 48%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
            )}
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Pie */}
            <div className="glass-card p-5">
              <h3 className="font-display font-semibold text-foreground mb-4">Ventas por Categoría</h3>
              {salesByCategory.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={salesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                        {salesByCategory.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatFullCLP(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {salesByCategory.map((c, i) => (
                      <div key={c.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-foreground flex-1">{c.name}</span>
                        <span className="text-muted-foreground">{formatCLP(c.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
              )}
            </div>

            {/* Payment Methods */}
            <div className="glass-card p-5">
              <h3 className="font-display font-semibold text-foreground mb-4">Métodos de Pago</h3>
              {paymentMethods.length > 0 ? (
                <div className="space-y-3">
                  {paymentMethods.map((pm, i) => {
                    const total = paymentMethods.reduce((s, p) => s + p.value, 0);
                    const pct = total > 0 ? Math.round((pm.value / total) * 100) : 0;
                    return (
                      <div key={pm.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-foreground">{pm.name}</span>
                          <span className="text-xs text-muted-foreground">{formatFullCLP(pm.value)} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
              )}
            </div>
          </div>

          {/* Peak Hours & Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Hours */}
            <div className="glass-card p-5">
              <h3 className="font-display font-semibold text-foreground mb-4">Horas Pico</h3>
              {peakHours.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={peakHours}>
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(220, 10%, 55%)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 55%)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="pedidos" name="Pedidos" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ fill: "hsl(142, 71%, 45%)", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
              )}
            </div>

            {/* Top Products */}
            <div className="glass-card p-5">
              <h3 className="font-display font-semibold text-foreground mb-4">Productos Más Vendidos</h3>
              {topProducts.length > 0 ? (
                <div className="space-y-2">
                  {topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                      <span className="text-xs font-bold text-primary w-5 text-center">#{i + 1}</span>
                      <span className="text-sm text-foreground flex-1 truncate">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.qty} uds</span>
                      <span className="text-xs font-medium text-foreground w-20 text-right">{formatCLP(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;

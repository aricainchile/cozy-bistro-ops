import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Receipt,
  RefreshCw, CalendarDays, ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ReportData {
  totalSales: number;
  totalOrders: number;
  avgTicket: number;
  totalGuests: number;
  salesChange: number;
  ordersChange: number;
  prevTotalSales: number;
  prevTotalOrders: number;
  paymentMethods: { method: string; amount: number }[];
  dailyTrend: { date: string; sales: number; orders: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  categorySales: { name: string; revenue: number }[];
}

interface WeeklyReport {
  id: string;
  week_start: string;
  week_end: string;
  report_data: ReportData;
  created_at: string;
}

const formatCLP = (n: number) => "$" + n.toLocaleString("es-CL");

const methodLabels: Record<string, string> = {
  efectivo: "Efectivo",
  debito: "Débito",
  credito: "Crédito",
  transferencia: "Transferencia",
  cuenta_empresa: "Cuenta Empresa",
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--info))",
  "hsl(var(--destructive))",
  "hsl(var(--accent))",
  "hsl(30 80% 55%)",
  "hsl(280 60% 55%)",
];

const Reports = () => {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("weekly_reports")
      .select("*")
      .order("week_start", { ascending: false })
      .limit(52);
    setReports((data as unknown as WeeklyReport[]) || []);
    setSelectedIndex(0);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke("generate-weekly-report");
      if (error) throw error;
      toast({ title: "Reporte generado", description: "El reporte semanal se ha generado correctamente." });
      await fetchReports();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  const report = reports[selectedIndex];
  const data = report?.report_data;

  const formatWeekLabel = (r: WeeklyReport) => {
    const start = new Date(r.week_start + "T12:00:00");
    const end = new Date(r.week_end + "T12:00:00");
    return `${format(start, "dd MMM", { locale: es })} – ${format(end, "dd MMM yyyy", { locale: es })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-6 h-6 text-primary" />
          <h2 className="font-display font-bold text-xl text-foreground">Reportes Semanales</h2>
        </div>
        <Button onClick={generateReport} disabled={generating} size="sm" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
          Generar Reporte
        </Button>
      </div>

      {reports.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display font-semibold text-lg text-foreground mb-2">Sin reportes aún</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Genera tu primer reporte semanal para ver el resumen de ventas y tendencias.
          </p>
          <Button onClick={generateReport} disabled={generating} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
            Generar Primer Reporte
          </Button>
        </div>
      ) : (
        <>
          {/* Week Navigator */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              disabled={selectedIndex >= reports.length - 1}
              onClick={() => setSelectedIndex((i) => i + 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-display font-semibold text-foreground min-w-[220px] text-center">
              {formatWeekLabel(report)}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={selectedIndex <= 0}
              onClick={() => setSelectedIndex((i) => i - 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Ventas Totales", value: formatCLP(data.totalSales), change: data.salesChange, icon: DollarSign, color: "text-success" },
              { label: "Pedidos", value: String(data.totalOrders), change: data.ordersChange, icon: ShoppingBag, color: "text-info" },
              { label: "Ticket Promedio", value: formatCLP(data.avgTicket), change: null, icon: Receipt, color: "text-primary" },
              { label: "Comensales", value: String(data.totalGuests), change: null, icon: Users, color: "text-accent" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card-hover p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  {stat.change !== null && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${stat.change >= 0 ? "text-success" : "text-destructive"}`}>
                      {stat.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(stat.change)}%
                    </div>
                  )}
                </div>
                <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Daily Trend Chart */}
          <div className="glass-card p-5">
            <h3 className="font-display font-semibold text-foreground mb-4">Tendencia Diaria</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rptSalesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => {
                      const d = new Date(v + "T12:00:00");
                      return format(d, "EEE", { locale: es });
                    }}
                  />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                    formatter={(value: number, name: string) => [name === "sales" ? formatCLP(value) : value, name === "sales" ? "Ventas" : "Pedidos"]}
                    labelFormatter={(v) => {
                      const d = new Date(v + "T12:00:00");
                      return format(d, "EEEE dd MMM", { locale: es });
                    }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" fill="url(#rptSalesGrad)" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="glass-card p-5">
              <h3 className="font-display font-semibold text-foreground mb-4">Top Productos</h3>
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
              ) : (
                <div className="space-y-3">
                  {data.topProducts.map((p, i) => {
                    const maxRev = data.topProducts[0]?.revenue || 1;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{formatCLP(p.revenue)}</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-1.5">
                            <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${(p.revenue / maxRev) * 100}%` }} />
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{p.quantity}u</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category Sales */}
            <div className="glass-card p-5">
              <h3 className="font-display font-semibold text-foreground mb-4">Ventas por Categoría</h3>
              {data.categorySales.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
              ) : (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.categorySales} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="revenue" stroke="none">
                          {data.categorySales.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
                    {data.categorySales.map((cat, i) => {
                      const total = data.categorySales.reduce((s, c) => s + c.revenue, 0);
                      const pct = total > 0 ? ((cat.revenue / total) * 100).toFixed(0) : "0";
                      return (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-xs text-foreground">{cat.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{pct}% · {formatCLP(cat.revenue)}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="glass-card p-5">
            <h3 className="font-display font-semibold text-foreground mb-4">Métodos de Pago</h3>
            {data.paymentMethods.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.paymentMethods} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis
                      dataKey="method"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => methodLabels[v] || v}
                    />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                      formatter={(value: number) => [formatCLP(value), "Monto"]}
                      labelFormatter={(v) => methodLabels[v] || v}
                    />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Comparison vs previous week */}
          <div className="glass-card p-5">
            <h3 className="font-display font-semibold text-foreground mb-4">Comparativa vs Semana Anterior</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Ventas semana actual</p>
                <p className="text-xl font-display font-bold text-foreground">{formatCLP(data.totalSales)}</p>
                <p className="text-xs text-muted-foreground mt-1">Anterior: {formatCLP(data.prevTotalSales)}</p>
                <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${data.salesChange >= 0 ? "text-success" : "text-destructive"}`}>
                  {data.salesChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {data.salesChange >= 0 ? "+" : ""}{data.salesChange}%
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Pedidos semana actual</p>
                <p className="text-xl font-display font-bold text-foreground">{data.totalOrders}</p>
                <p className="text-xs text-muted-foreground mt-1">Anterior: {data.prevTotalOrders}</p>
                <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${data.ordersChange >= 0 ? "text-success" : "text-destructive"}`}>
                  {data.ordersChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {data.ordersChange >= 0 ? "+" : ""}{data.ordersChange}%
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;

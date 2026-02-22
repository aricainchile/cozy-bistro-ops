import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Users, Calendar } from "lucide-react";

const Analytics = () => {
  const weekData = [
    { day: "Lun", sales: 850000, orders: 42 },
    { day: "Mar", sales: 920000, orders: 48 },
    { day: "Mié", sales: 780000, orders: 38 },
    { day: "Jue", sales: 1050000, orders: 55 },
    { day: "Vie", sales: 1380000, orders: 72 },
    { day: "Sáb", sales: 1520000, orders: 80 },
    { day: "Dom", sales: 1100000, orders: 58 },
  ];
  const maxSales = Math.max(...weekData.map((d) => d.sales));
  const formatPrice = (n: number) => `$${(n / 1000).toFixed(0)}k`;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Ventas Semanales", value: "$7.600.000", change: "+15%", icon: DollarSign },
          { label: "Ticket Promedio", value: "$19.500", change: "+3%", icon: TrendingUp },
          { label: "Pedidos Totales", value: "393", change: "+12%", icon: ShoppingBag },
          { label: "Clientes Únicos", value: "245", change: "+8%", icon: Users },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card-hover p-5">
            <kpi.icon className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-display font-bold text-foreground">{kpi.value}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <span className="text-xs text-success font-medium">{kpi.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Simple bar chart */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-foreground">Ventas por Día</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" /> Esta semana
          </div>
        </div>
        <div className="flex items-end gap-3 h-48">
          {weekData.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{formatPrice(d.sales)}</span>
              <div
                className="w-full rounded-t-lg gradient-primary transition-all duration-500 hover:opacity-80"
                style={{ height: `${(d.sales / maxSales) * 100}%` }}
              />
              <span className="text-xs text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">Ventas por Categoría</h3>
          <div className="space-y-3">
            {[
              { cat: "Carne", pct: 28, sales: "$2.128.000" },
              { cat: "Cocktail", pct: 18, sales: "$1.368.000" },
              { cat: "Cervezas", pct: 15, sales: "$1.140.000" },
              { cat: "Pollo", pct: 12, sales: "$912.000" },
              { cat: "Acompañamientos", pct: 10, sales: "$760.000" },
              { cat: "Otros", pct: 17, sales: "$1.292.000" },
            ].map((c) => (
              <div key={c.cat}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">{c.cat}</span>
                  <span className="text-xs text-muted-foreground">{c.sales} ({c.pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full gradient-primary" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">Horas Pico</h3>
          <div className="space-y-2">
            {[
              { hour: "12:00 - 14:00", orders: 45, pct: 85 },
              { hour: "19:00 - 21:00", orders: 52, pct: 100 },
              { hour: "14:00 - 16:00", orders: 20, pct: 38 },
              { hour: "16:00 - 19:00", orders: 28, pct: 54 },
              { hour: "21:00 - 23:00", orders: 35, pct: 67 },
            ].map((h) => (
              <div key={h.hour} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                <span className="text-xs text-muted-foreground w-28">{h.hour}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full gradient-primary" style={{ width: `${h.pct}%` }} />
                </div>
                <span className="text-xs text-foreground w-16 text-right">{h.orders} pedidos</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
